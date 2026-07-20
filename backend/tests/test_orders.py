from datetime import datetime, timedelta, timezone

import pytest
from flask import Flask
from flask_jwt_extended import JWTManager
from pydantic import ValidationError
from pymongo.errors import DuplicateKeyError

from app.api import orders as orders_api
from app.extensions import limiter
from app.repositories.orders_repo import OrdersRepository
from app.services.order_service import OrderService
from app.utils.errors import AppError
from app.utils.response import error_response
from app.validators.order import CreateOrderInput

NOW = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)


def verified_product(**overrides):
    product = {
        "_id": "mongo-product-1",
        "id": "product-1",
        "name": "Produit vérifié",
        "isPublished": True,
        "price": 100.0,
        "promoPrice": None,
        "priceVerifiedAt": NOW - timedelta(days=1),
        "priceSource": "caisse:QA-PRODUCT-1",
        "stock": 5,
        "stockVerified": True,
        "stockVerifiedAt": NOW - timedelta(hours=1),
        "deliveryEligible": True,
    }
    product.update(overrides)
    return product


class FakeProducts:
    def __init__(self, products):
        self.products = products

    def get_by_id(self, product_id):
        return self.products.get(product_id)


class FakeOrders:
    def __init__(self):
        self.created = None
        self.by_request_id = {}

    def get_by_request_id(self, request_id):
        return self.by_request_id.get(request_id)

    def create_idempotent(self, payload):
        existing = self.by_request_id.get(payload["request_id"])
        if existing:
            return existing, False
        self.created = payload
        order = {
            "_id": "order-1",
            "created_at": NOW,
            "updated_at": NOW,
            **payload,
        }
        self.by_request_id[payload["request_id"]] = order
        return order, True


class FakeAudit:
    def log(self, *_args, **_kwargs):
        return None


def service_for(products):
    service = OrderService.__new__(OrderService)
    service.products = FakeProducts(products)
    service.orders = FakeOrders()
    service.audit = FakeAudit()
    return service


def create_order(service, **overrides):
    payload = {
        "user_id": None,
        "items": [{"product_id": "product-1", "quantity": 2}],
        "shipping_address": {"city": "Khouribga", "address": "251 Ancienne Médina"},
        "payment_method": "COD",
        "request_id": "qa-request-00000001",
        "now": NOW,
    }
    payload.update(overrides)
    return service.create_order(**payload)


def assert_rejected(product_overrides, message):
    service = service_for({"product-1": verified_product(**product_overrides)})
    with pytest.raises(AppError, match=message):
        create_order(service)
    assert service.orders.created is None


def test_cod_uses_server_price_and_khouribga_fee_while_ignoring_browser_totals():
    parsed = CreateOrderInput.model_validate(
        {
            "items": [
                {
                    "product_id": "product-1",
                    "quantity": 2,
                    "price": 0.01,
                    "subtotal": 0.02,
                    "stock": 9999,
                }
            ],
            "shipping_address": {
                "first_name": "Amal",
                "last_name": "Test",
                "whatsapp": "0612345678",
                "city": "Khouribga",
                "address": "251 Ancienne Médina",
                "delivery_fee": 0,
            },
            "payment_method": "COD",
            "request_id": "qa-request-00000001",
            "subtotal": 0.02,
            "delivery_fee": 0,
            "total": 0.02,
        }
    )
    assert parsed.items[0].model_dump() == {"product_id": "product-1", "quantity": 2}
    assert "delivery_fee" not in parsed.model_dump()

    service = service_for({"product-1": verified_product(price=100.0)})
    result = create_order(
        service,
        items=[item.model_dump() for item in parsed.items],
        shipping_address=parsed.shipping_address.model_dump(),
        payment_method=parsed.payment_method,
        request_id=parsed.request_id,
    )

    assert result["payment_method"] == "cod"
    assert result["items"][0]["price"] == 100.0
    assert result["items"][0]["subtotal"] == 200.0
    assert result["subtotal"] == 200.0
    assert result["delivery_fee"] == 15.0
    assert result["total"] == 215.0
    assert result["delivery_service_confirmed"] is True
    assert result["inventory_reserved"] is False
    assert "non réservé" in result["order_notice"]
    assert result["idempotent_replay"] is False


def test_order_input_normalizes_supported_moroccan_whatsapp_format():
    parsed = CreateOrderInput.model_validate(
        {
            "items": [{"product_id": "product-1", "quantity": 1}],
            "shipping_address": {
                "first_name": "Amal",
                "last_name": "Test",
                "whatsapp": "06 75 69 83 51",
                "city": "Khouribga",
                "address": "251 Ancienne Médina",
            },
            "request_id": "qa-request-00000002",
        }
    )

    assert parsed.shipping_address.whatsapp == "+212675698351"


@pytest.mark.parametrize("whatsapp", ["061234567", "0512345678", "abcdefghij"])
def test_order_input_rejects_uncontactable_whatsapp(whatsapp):
    with pytest.raises(ValidationError):
        CreateOrderInput.model_validate(
            {
                "items": [{"product_id": "product-1", "quantity": 1}],
                "shipping_address": {
                    "first_name": "Amal",
                    "last_name": "Test",
                    "whatsapp": whatsapp,
                    "city": "Khouribga",
                    "address": "251 Ancienne Médina",
                },
                "request_id": "qa-request-00000003",
            }
        )


def test_order_input_limits_anonymous_lookup_fanout():
    with pytest.raises(ValidationError):
        CreateOrderInput.model_validate(
            {
                "items": [{"product_id": f"product-{index}", "quantity": 1} for index in range(21)],
                "shipping_address": {
                    "first_name": "Amal",
                    "last_name": "Test",
                    "whatsapp": "0612345678",
                    "city": "Khouribga",
                    "address": "251 Ancienne Médina",
                },
                "request_id": "qa-request-00000004",
            }
        )


@pytest.mark.parametrize("payment_method", ["CMI", "apple_pay", "Apple Pay", "card"])
def test_non_cod_payment_methods_are_rejected(payment_method):
    service = service_for({"product-1": verified_product()})
    with pytest.raises(AppError, match="paiement à la livraison"):
        create_order(service, payment_method=payment_method)
    assert service.orders.created is None


def test_missing_price_verification_is_rejected():
    assert_rejected({"priceVerifiedAt": None, "priceSource": None}, "Prix actuel non vérifié")


def test_expired_price_verification_is_rejected():
    assert_rejected(
        {"priceVerifiedAt": NOW - timedelta(days=30, seconds=1)},
        "Prix actuel non vérifié",
    )


@pytest.mark.parametrize(
    "overrides",
    [
        {"stockVerified": None, "stockVerifiedAt": None},
        {"stockVerifiedAt": NOW - timedelta(hours=24, seconds=1)},
    ],
)
def test_missing_or_expired_stock_verification_is_rejected(overrides):
    assert_rejected(overrides, "Stock actuel non vérifié")


@pytest.mark.parametrize("stock", [0, -1])
def test_zero_or_negative_verified_stock_is_rejected(stock):
    assert_rejected({"stock": stock}, "Stock vérifié indisponible")


def test_missing_delivery_eligibility_is_rejected():
    assert_rejected({"deliveryEligible": None}, "Livraison non vérifiée")


def test_unknown_product_is_rejected():
    service = service_for({})
    with pytest.raises(AppError, match="Produit introuvable") as error:
        create_order(service)
    assert error.value.status_code == 404
    assert service.orders.created is None


def test_unpublished_product_is_rejected():
    service = service_for({"product-1": verified_product(isPublished=False)})
    with pytest.raises(AppError, match="Produit introuvable") as error:
        create_order(service)
    assert error.value.status_code == 404
    assert service.orders.created is None


def test_non_khouribga_fee_requires_service_confirmation():
    service = service_for({"product-1": verified_product()})
    result = create_order(
        service,
        shipping_address={"city": "Casablanca", "address": "Adresse Casablanca"},
    )

    assert result["delivery_fee"] == 35.0
    assert result["total"] == 235.0
    assert result["delivery_service_confirmed"] is False
    assert "confirmer" in result["delivery_notice"]


def test_unverifiable_city_is_rejected_without_guessing_coverage():
    service = service_for({"product-1": verified_product()})
    with pytest.raises(AppError, match="Ville de livraison non vérifiable"):
        create_order(service, shipping_address={"city": "12345", "address": "Adresse"})


def test_duplicate_aliases_cannot_bypass_verified_stock():
    product = verified_product(stock=3)
    service = service_for({"product-1": product, "produit-verifie": product})
    with pytest.raises(AppError, match="Stock vérifié insuffisant"):
        create_order(
            service,
            items=[
                {"product_id": "product-1", "quantity": 2},
                {"product_id": "produit-verifie", "quantity": 2},
            ],
        )
    assert service.orders.created is None


def valid_order_input(**shipping_overrides):
    shipping = {
        "first_name": "Amal",
        "last_name": "Test",
        "whatsapp": "0612345678",
        "city": "Khouribga",
        "address": "251 Ancienne Médina",
        **shipping_overrides,
    }
    return {
        "items": [{"product_id": "product-1", "quantity": 1}],
        "shipping_address": shipping,
        "payment_method": "cod",
        "request_id": "qa-request-00000005",
    }


def test_order_input_accepts_blank_optional_email_and_rejects_invalid_email():
    parsed = CreateOrderInput.model_validate(valid_order_input(email=""))
    assert parsed.shipping_address.email is None

    with pytest.raises(ValidationError):
        CreateOrderInput.model_validate(valid_order_input(email="not-an-email"))


def test_order_input_rejects_boolean_quantity_and_non_morocco_country():
    invalid_quantity = valid_order_input()
    invalid_quantity["items"][0]["quantity"] = True
    with pytest.raises(ValidationError, match="not a boolean"):
        CreateOrderInput.model_validate(invalid_quantity)

    with pytest.raises(ValidationError):
        CreateOrderInput.model_validate(valid_order_input(country_code="FR"))


def test_idempotent_retry_returns_same_order_without_second_insert():
    service = service_for({"product-1": verified_product()})
    first = create_order(service)
    second = create_order(service)

    assert first["id"] == second["id"]
    assert first["idempotent_replay"] is False
    assert second["idempotent_replay"] is True
    assert len(service.orders.by_request_id) == 1


def test_reusing_request_id_with_different_payload_is_rejected():
    service = service_for({"product-1": verified_product()})
    create_order(service)

    with pytest.raises(AppError, match="contenu différent") as error:
        create_order(
            service,
            shipping_address={"city": "Rabat", "address": "Adresse Rabat"},
        )
    assert error.value.status_code == 409


def _rate_limit_test_app(monkeypatch, *, replay=False):
    class FakeService:
        @staticmethod
        def create_order(**_kwargs):
            return {
                "id": "order-http",
                "idempotent_replay": replay,
                "inventory_reserved": False,
            }

    monkeypatch.setattr(orders_api, "get_order_service", lambda: FakeService())
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        JWT_SECRET_KEY="unit-test-only",
        RATELIMIT_STORAGE_URI="memory://",
        RATELIMIT_STRATEGY="fixed-window",
    )
    JWTManager(app)
    limiter.init_app(app)
    app.register_blueprint(orders_api.orders_bp)

    @app.errorhandler(429)
    def rate_limited(_error):
        return error_response("Too many requests", 429)

    return app


def test_order_http_status_and_rate_limit(monkeypatch):
    app = _rate_limit_test_app(monkeypatch)
    payload = valid_order_input()

    with app.test_client() as client:
        for index in range(10):
            payload["request_id"] = f"qa-http-request-{index:03d}"
            assert client.post("/orders", json=payload).status_code == 201
        response = client.post("/orders", json=payload)

    assert response.status_code == 429


def test_idempotent_http_replay_returns_200(monkeypatch):
    app = _rate_limit_test_app(monkeypatch, replay=True)
    with app.test_client() as client:
        response = client.post("/orders", json=valid_order_input())
    assert response.status_code == 200


def test_repository_duplicate_key_race_returns_existing_order():
    existing = {
        "_id": "order-race",
        "request_id": "qa-race-request-0001",
        "request_fingerprint": "fingerprint",
    }

    class FakeCollection:
        @staticmethod
        def insert_one(_document):
            raise DuplicateKeyError("duplicate request id")

        @staticmethod
        def find_one(query):
            assert query == {"request_id": "qa-race-request-0001"}
            return existing

    repository = OrdersRepository.__new__(OrdersRepository)
    repository.col = FakeCollection()
    order, created = repository.create_idempotent(
        {
            "request_id": "qa-race-request-0001",
            "request_fingerprint": "fingerprint",
        }
    )

    assert order is existing
    assert created is False
