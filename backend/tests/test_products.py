from datetime import datetime, timedelta, timezone

import pytest
from flask import Flask
from pydantic import ValidationError
from pymongo import ReturnDocument

from app.api import products as products_api
from app.repositories.products_repo import ProductsRepository
from app.services.product_service import (
    ProductService,
    get_effective_verified_price,
    has_current_price_evidence,
    has_current_stock_evidence,
)
from app.validators.product import ProductInput, ProductUpdate

MINIMAL_PAYLOAD = {
    "name": "Produit Test",
    "category": "Visage",
    "price": 100.0,
    "stock": 5,
}
VALID_EAN = "3282770139204"


def test_product_input_accepts_legacy_payload_without_new_fields():
    """Existing admin payloads keep working without invented truth metadata."""
    product = ProductInput(**MINIMAL_PAYLOAD)

    assert product.sku is None
    assert product.ean is None
    assert product.size is None
    assert product.priceVerifiedAt is None
    assert product.priceSource is None
    assert product.stockVerified is None
    assert product.stockVerifiedAt is None
    assert product.deliveryEligible is None


def test_product_input_accepts_verified_source_fields_when_provided():
    verified_at = datetime(2026, 7, 16, tzinfo=timezone.utc)
    product = ProductInput(
        **MINIMAL_PAYLOAD,
        sku="AVENE-CLEANANCE-400",
        ean=VALID_EAN,
        size="400ml",
        priceVerifiedAt=verified_at,
        priceSource="catalogue-interne:AVENE-CLEANANCE-400",
        stockVerified=True,
        stockVerifiedAt=verified_at,
        deliveryEligible=False,
    )

    assert product.sku == "AVENE-CLEANANCE-400"
    assert product.ean == VALID_EAN
    assert product.size == "400ml"
    assert product.priceVerifiedAt == verified_at
    assert product.priceSource == "catalogue-interne:AVENE-CLEANANCE-400"
    assert product.stockVerified is True
    assert product.stockVerifiedAt == verified_at
    assert product.deliveryEligible is False


@pytest.mark.parametrize(
    "ean",
    [
        "1234567",
        "ABCDEFGHIJKLM",
        "3282770139205",
    ],
)
def test_product_input_rejects_invalid_ean(ean):
    with pytest.raises(ValidationError):
        ProductInput(**MINIMAL_PAYLOAD, ean=ean)


@pytest.mark.parametrize(
    "evidence",
    [
        {"priceVerifiedAt": datetime(2026, 7, 16, tzinfo=timezone.utc)},
        {"priceSource": "erp:PRODUCT-1"},
    ],
)
def test_product_input_requires_price_date_and_source_together(evidence):
    with pytest.raises(ValidationError):
        ProductInput(**MINIMAL_PAYLOAD, **evidence)


def test_product_input_rejects_non_owner_price_source():
    with pytest.raises(ValidationError):
        ProductInput(
            **MINIMAL_PAYLOAD,
            priceVerifiedAt=datetime(2026, 7, 16, tzinfo=timezone.utc),
            priceSource="https://parapharmacie.ma/produit/example",
        )


def test_product_input_aligns_traceable_source_grammar_case_insensitively():
    verified_at = datetime(2026, 7, 16, tzinfo=timezone.utc)
    accepted = ProductInput(
        **MINIMAL_PAYLOAD,
        priceVerifiedAt=verified_at,
        priceSource="ERP:SKU-123",
    )
    assert accepted.priceSource == "ERP:SKU-123"

    with pytest.raises(ValidationError):
        ProductInput(
            **MINIMAL_PAYLOAD,
            priceVerifiedAt=verified_at,
            priceSource="erp:AB",
        )


@pytest.mark.parametrize(
    "evidence",
    [
        {
            "priceVerifiedAt": datetime.now(timezone.utc) + timedelta(minutes=5),
            "priceSource": "erp:SKU-1",
        },
        {
            "stockVerified": True,
            "stockVerifiedAt": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
    ],
)
def test_product_input_rejects_future_evidence_timestamps(evidence):
    with pytest.raises(ValidationError, match="may not be in the future"):
        ProductInput(**MINIMAL_PAYLOAD, **evidence)


@pytest.mark.parametrize(
    "evidence",
    [
        {
            "priceVerifiedAt": datetime(2026, 7, 16),
            "priceSource": "erp:SKU-1",
        },
        {
            "stockVerified": True,
            "stockVerifiedAt": datetime(2026, 7, 16),
        },
    ],
)
def test_product_input_rejects_timezone_naive_evidence(evidence):
    with pytest.raises(ValidationError, match="timezone offset"):
        ProductInput(**MINIMAL_PAYLOAD, **evidence)


@pytest.mark.parametrize(
    "payload",
    [
        {**MINIMAL_PAYLOAD, "price": True},
        {**MINIMAL_PAYLOAD, "price": float("inf")},
        {**MINIMAL_PAYLOAD, "promoPrice": float("nan")},
        {**MINIMAL_PAYLOAD, "stock": True},
    ],
)
def test_product_input_rejects_boolean_or_non_finite_commerce_values(payload):
    with pytest.raises(ValidationError):
        ProductInput(**payload)


@pytest.mark.parametrize(
    "evidence",
    [
        {"stockVerified": True},
        {"stockVerifiedAt": datetime(2026, 7, 16, tzinfo=timezone.utc)},
        {
            "stockVerified": False,
            "stockVerifiedAt": datetime(2026, 7, 16, tzinfo=timezone.utc),
        },
    ],
)
def test_product_input_rejects_inconsistent_stock_evidence(evidence):
    with pytest.raises(ValidationError):
        ProductInput(**MINIMAL_PAYLOAD, **evidence)


def test_product_input_still_requires_core_fields():
    with pytest.raises(ValidationError):
        ProductInput(sku="ONLY-SKU-NO-PRICE")


def test_product_update_serializes_only_fields_supplied_by_caller():
    payload = ProductUpdate(name="Nouveau nom").model_dump(exclude_unset=True)

    assert payload == {"name": "Nouveau nom"}


def test_product_update_preserves_explicit_null_clearing():
    payload = ProductUpdate(
        ean=None,
        priceVerifiedAt=None,
        priceSource=None,
        stockVerified=None,
        stockVerifiedAt=None,
        deliveryEligible=None,
    ).model_dump(exclude_unset=True)

    assert payload == {
        "ean": None,
        "priceVerifiedAt": None,
        "priceSource": None,
        "stockVerified": None,
        "stockVerifiedAt": None,
        "deliveryEligible": None,
    }


@pytest.mark.parametrize(
    "payload",
    [
        {"priceVerifiedAt": None},
        {"priceSource": None},
        {"price": 120},
        {"stockVerified": False},
        {"stockVerifiedAt": None},
        {"stock": 6},
    ],
)
def test_product_update_requires_evidence_pairs_even_when_clearing(payload):
    with pytest.raises(ValidationError):
        ProductUpdate(**payload)


@pytest.mark.parametrize(
    "payload",
    [
        {"price": True, "priceVerifiedAt": None, "priceSource": None},
        {"price": float("inf"), "priceVerifiedAt": None, "priceSource": None},
        {"stock": True, "stockVerified": None, "stockVerifiedAt": None},
    ],
)
def test_product_update_rejects_boolean_or_non_finite_commerce_values(payload):
    with pytest.raises(ValidationError):
        ProductUpdate(**payload)


def test_update_endpoint_does_not_send_omitted_defaults_to_repository(monkeypatch):
    captured = {}

    class FakeService:
        @staticmethod
        def update_product(product_id, payload):
            captured["product_id"] = product_id
            captured["payload"] = payload
            return {"id": product_id, **payload}

    monkeypatch.setattr(products_api, "get_product_service", lambda: FakeService())

    app = Flask(__name__)
    with app.test_request_context(json={"name": "Nom modifié"}):
        _, status = products_api.update_product.__wrapped__("product-1")

    assert status == 200
    assert captured == {
        "product_id": "product-1",
        "payload": {"name": "Nom modifié"},
    }


def test_repository_update_returns_document_after_slug_change():
    captured = {}

    class FakeCollection:
        @staticmethod
        def find_one_and_update(query, update, return_document):
            captured["query"] = query
            captured["update"] = update
            captured["return_document"] = return_document
            return {"_id": "mongo-id", "slug": update["$set"]["slug"]}

    repository = ProductsRepository.__new__(ProductsRepository)
    repository.col = FakeCollection()
    caller_updates = {"slug": "nouveau-slug"}

    updated = repository.update("ancien-slug", caller_updates)

    assert updated["slug"] == "nouveau-slug"
    assert caller_updates == {"slug": "nouveau-slug"}
    assert {"slug": "ancien-slug"} in captured["query"]["$or"]
    assert captured["update"]["$set"]["slug"] == "nouveau-slug"
    assert captured["return_document"] is ReturnDocument.AFTER


def _normalize(doc):
    # _normalize() is a pure function of its dict argument — bypass
    # ProductService.__init__ so this test never touches a real MongoDB
    # connection.
    service = ProductService.__new__(ProductService)
    return service._normalize(doc)


def test_normalize_never_invents_unverified_fields():
    """A raw Mongo doc without truth fields stays unknown, not guessed."""
    doc = {
        "_id": "abc123",
        "name": "Produit Legacy",
        "category": "Visage",
        "price": 100,
        "stock": 17,
    }
    normalized = _normalize(doc)

    assert normalized["sku"] is None
    assert normalized["ean"] is None
    assert normalized["size"] is None
    assert normalized["priceVerifiedAt"] is None
    assert normalized["priceSource"] is None
    assert normalized["price"] is None
    assert normalized["promoPrice"] is None
    assert normalized["stock"] is None
    assert normalized["stockVerified"] is None
    assert normalized["stockVerifiedAt"] is None
    assert normalized["deliveryEligible"] is None
    assert normalized["isPublished"] is False


def test_normalize_passes_through_verified_fields_unchanged():
    verified_at = datetime.now(timezone.utc)
    doc = {
        "_id": "abc123",
        "name": "Produit Verifie",
        "category": "Visage",
        "price": 100,
        "promoPrice": 90,
        "stock": 5,
        "sku": "SKU-1",
        "ean": VALID_EAN,
        "size": "400ml",
        "priceVerifiedAt": verified_at,
        "priceSource": "erp:SKU-1",
        "stockVerified": True,
        "stockVerifiedAt": verified_at,
        "deliveryEligible": False,
        "isPublished": True,
    }
    normalized = _normalize(doc)

    assert normalized["sku"] == "SKU-1"
    assert normalized["ean"] == VALID_EAN
    assert normalized["size"] == "400ml"
    assert normalized["priceVerifiedAt"] == verified_at
    assert normalized["priceSource"] == "erp:SKU-1"
    assert normalized["price"] == 100
    assert normalized["promoPrice"] == 90
    assert normalized["stock"] == 5
    assert normalized["stockVerified"] is True
    assert normalized["stockVerifiedAt"] == verified_at
    assert normalized["deliveryEligible"] is False
    assert normalized["isPublished"] is True


def test_repository_public_lookup_requires_explicit_publication():
    captured = {}

    class FakeCollection:
        @staticmethod
        def find_one(query):
            captured["query"] = query
            return None

    repository = ProductsRepository.__new__(ProductsRepository)
    repository.col = FakeCollection()

    assert repository.get_public_by_id("product-1") is None
    assert captured["query"]["isPublished"] is True


def test_current_price_evidence_uses_a_fail_closed_thirty_day_window():
    now = datetime(2026, 7, 17, tzinfo=timezone.utc)
    verified = {
        "price": 100,
        "priceVerifiedAt": now - timedelta(days=30),
        "priceSource": "erp:SKU-1",
    }

    assert has_current_price_evidence(verified, now=now)
    assert not has_current_price_evidence(
        {
            **verified,
            "priceVerifiedAt": now - timedelta(days=30, seconds=1),
        },
        now=now,
    )
    assert not has_current_price_evidence(
        {
            **verified,
            "priceVerifiedAt": now + timedelta(seconds=1),
        },
        now=now,
    )
    assert not has_current_price_evidence(
        {**verified, "priceVerifiedAt": now, "priceSource": "   "}, now=now
    )
    assert not has_current_price_evidence(
        {
            **verified,
            "priceVerifiedAt": now,
            "priceSource": "https://parapharmacie.ma/produit/example",
        },
        now=now,
    )


def test_effective_verified_price_uses_only_a_valid_lower_promotion():
    now = datetime(2026, 7, 17, tzinfo=timezone.utc)
    verified = {
        "price": 100,
        "priceVerifiedAt": now,
        "priceSource": "erp:SKU-1",
    }

    assert get_effective_verified_price({**verified, "promoPrice": 80}, now=now) == 80
    assert get_effective_verified_price({**verified, "promoPrice": 120}, now=now) == 100
    assert get_effective_verified_price({**verified, "promoPrice": -5}, now=now) == 100
    assert get_effective_verified_price({"price": 100}, now=now) is None


def test_current_stock_evidence_uses_a_fail_closed_twenty_four_hour_window():
    now = datetime(2026, 7, 17, tzinfo=timezone.utc)
    verified = {
        "stock": 5,
        "stockVerified": True,
        "stockVerifiedAt": now - timedelta(hours=24),
    }

    assert has_current_stock_evidence(verified, now=now)
    assert not has_current_stock_evidence(
        {**verified, "stockVerifiedAt": now - timedelta(hours=24, seconds=1)}, now=now
    )
    assert not has_current_stock_evidence(
        {**verified, "stockVerifiedAt": now + timedelta(seconds=1)}, now=now
    )
    assert not has_current_stock_evidence({**verified, "stockVerified": False}, now=now)
