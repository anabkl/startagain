from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import json
import secrets
import unicodedata

from app.repositories.audit_repo import AuditRepository
from app.repositories.orders_repo import OrdersRepository
from app.repositories.products_repo import ProductsRepository
from app.services.product_service import (
    get_effective_verified_price,
    has_current_stock_evidence,
)
from app.utils.errors import AppError

COD_PAYMENT_METHOD = "cod"
KHOURIBGA_DELIVERY_FEE_MAD = Decimal("15.00")
OTHER_MOROCCO_DELIVERY_FEE_MAD = Decimal("35.00")
MONEY_QUANTUM = Decimal("0.01")


def _money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(str(value)).quantize(MONEY_QUANTUM, rounding=ROUND_HALF_UP)


def _normalize_city(value: object) -> str:
    if not isinstance(value, str):
        return ""
    normalized = unicodedata.normalize("NFKD", value.strip())
    return " ".join(
        "".join(character for character in normalized if not unicodedata.combining(character))
        .casefold()
        .split()
    )


def _delivery_for_city(city: object) -> tuple[Decimal, bool, str]:
    normalized_city = _normalize_city(city)
    if normalized_city == "khouribga":
        return (
            KHOURIBGA_DELIVERY_FEE_MAD,
            True,
            "Livraison Khouribga confirmée au tarif local.",
        )

    # Do not guess nearby communes or silently classify arbitrary text as a
    # supported destination. A plausible named city can be recorded with the
    # configured Morocco fee only while service confirmation remains explicit.
    if (
        len(normalized_city) < 2
        or len(normalized_city) > 80
        or not all(character.isalpha() or character in " '-." for character in normalized_city)
        or sum(character.isalpha() for character in normalized_city) < 2
    ):
        raise AppError(
            "Ville de livraison non vérifiable; confirmez la destination avant la commande",
            422,
        )
    return (
        OTHER_MOROCCO_DELIVERY_FEE_MAD,
        False,
        "Destination et service de livraison à confirmer avant expédition.",
    )


class OrderService:
    def __init__(self) -> None:
        self.orders = OrdersRepository()
        self.products = ProductsRepository()
        self.audit = AuditRepository()

    def _normalize(self, doc: dict):
        return {
            "id": str(doc["_id"]),
            "request_id": doc.get("request_id"),
            "user_id": doc.get("user_id"),
            "items": doc.get("items", []),
            "shipping_address": doc.get("shipping_address", {}),
            "payment_method": doc.get("payment_method", "cod"),
            "status": doc.get("status", "pending"),
            "subtotal": float(doc.get("subtotal", 0)),
            "delivery_fee": float(doc.get("delivery_fee", 0)),
            "delivery_service_confirmed": doc.get("delivery_service_confirmed", False),
            "delivery_notice": doc.get("delivery_notice"),
            "inventory_reserved": doc.get("inventory_reserved", False),
            "order_notice": doc.get("order_notice"),
            "total": float(doc.get("total", 0)),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }

    def create_order(
        self,
        *,
        user_id: str | None,
        items: list[dict],
        shipping_address: dict,
        payment_method: str,
        request_id: str,
        now: datetime | None = None,
    ):
        if not items:
            raise AppError("Order items cannot be empty", 422)

        if (
            not isinstance(payment_method, str)
            or payment_method.strip().casefold() != COD_PAYMENT_METHOD
        ):
            raise AppError("Seul le paiement à la livraison est actuellement disponible", 422)

        current_time = now or datetime.now(timezone.utc)
        delivery_fee, delivery_service_confirmed, delivery_notice = _delivery_for_city(
            shipping_address.get("city")
        )

        request_fingerprint = hashlib.sha256(
            json.dumps(
                {
                    "user_id": user_id,
                    "items": items,
                    "shipping_address": shipping_address,
                    "payment_method": COD_PAYMENT_METHOD,
                },
                sort_keys=True,
                separators=(",", ":"),
                default=str,
            ).encode("utf-8")
        ).hexdigest()
        existing_order = self.orders.get_by_request_id(request_id)
        if existing_order:
            if not secrets.compare_digest(
                str(existing_order.get("request_fingerprint", "")), request_fingerprint
            ):
                raise AppError("Identifiant de demande déjà utilisé avec un contenu différent", 409)
            replay = self._normalize(existing_order)
            replay["idempotent_replay"] = True
            return replay

        # Resolve aliases/slugs to one canonical product row before calculating
        # quantities. This prevents duplicate lines from bypassing stock limits.
        resolved_lines: dict[str, dict] = {}
        for item in items:
            product = self.products.get_by_id(item["product_id"])
            if not product or product.get("isPublished") is not True:
                raise AppError("Produit introuvable dans le catalogue", 404)

            product_name = product.get("name") or "Produit"
            if product.get("deliveryEligible") is not True:
                raise AppError(f"Livraison non vérifiée pour: {product_name}", 409)

            price = get_effective_verified_price(product, now=current_time)
            if price is None:
                raise AppError(f"Prix actuel non vérifié pour: {product_name}", 409)

            stock = product.get("stock")
            if not isinstance(stock, int) or isinstance(stock, bool) or stock <= 0:
                raise AppError(f"Stock vérifié indisponible pour: {product_name}", 409)
            if not has_current_stock_evidence(product, now=current_time):
                raise AppError(f"Stock actuel non vérifié pour: {product_name}", 409)

            qty = int(item["quantity"])
            canonical_id = str(product.get("_id") or product.get("id") or item["product_id"])
            existing = resolved_lines.get(canonical_id)
            requested_quantity = qty + (existing["quantity"] if existing else 0)
            if requested_quantity > stock:
                raise AppError(f"Stock vérifié insuffisant pour: {product_name}", 409)
            resolved_lines[canonical_id] = {
                "product": product,
                "name": product_name,
                "quantity": requested_quantity,
                "price": _money(price),
            }

        order_items = []
        subtotal_total = Decimal("0.00")
        for canonical_id, line in resolved_lines.items():
            line_subtotal = _money(line["price"] * line["quantity"])
            subtotal_total += line_subtotal
            order_items.append(
                {
                    "product_id": canonical_id,
                    "name": line["name"],
                    "quantity": line["quantity"],
                    "price": float(line["price"]),
                    "subtotal": float(line_subtotal),
                }
            )

        subtotal_total = _money(subtotal_total)
        total = _money(subtotal_total + delivery_fee)

        order, created = self.orders.create_idempotent(
            {
                "request_id": request_id,
                "request_fingerprint": request_fingerprint,
                "user_id": user_id,
                "items": order_items,
                "shipping_address": shipping_address,
                "payment_method": COD_PAYMENT_METHOD,
                "status": "pending",
                "subtotal": float(subtotal_total),
                "delivery_fee": float(delivery_fee),
                "delivery_service_confirmed": delivery_service_confirmed,
                "delivery_notice": delivery_notice,
                # This endpoint records a pending COD request. It checks the
                # latest verified quantity but does not claim an inventory
                # reservation; fulfillment must reconfirm stock before dispatch.
                "inventory_reserved": False,
                "order_notice": (
                    "Demande enregistrée; le stock est contrôlé mais non réservé "
                    "et sera reconfirmé avant expédition."
                ),
                "total": float(total),
            }
        )
        if not secrets.compare_digest(
            str(order.get("request_fingerprint", "")), request_fingerprint
        ):
            raise AppError("Identifiant de demande déjà utilisé avec un contenu différent", 409)
        if created:
            self.audit.log(
                "order.created",
                user_id,
                {"order_id": str(order["_id"]), "total": order["total"]},
            )
        normalized = self._normalize(order)
        normalized["idempotent_replay"] = not created
        return normalized

    def get_order(self, order_id: str):
        order = self.orders.get_by_id(order_id)
        if not order:
            raise AppError("Order not found", 404)
        return self._normalize(order)

    def my_orders(self, user_id: str, page: int, per_page: int):
        docs, total = self.orders.list_for_user(user_id=user_id, page=page, per_page=per_page)
        return [self._normalize(item) for item in docs], total

    def list_orders(self, page: int, per_page: int, status: str | None = None):
        docs, total = self.orders.list_all(page=page, per_page=per_page, status=status)
        return [self._normalize(item) for item in docs], total

    def update_status(self, order_id: str, status: str):
        updated = self.orders.update_status(order_id, status)
        if not updated:
            raise AppError("Order not found", 404)
        self.audit.log("order.status_updated", None, {"order_id": order_id, "status": status})
        return self._normalize(updated)

    def delete_order(self, order_id: str):
        deleted = self.orders.delete(order_id)
        if not deleted:
            raise AppError("Order not found", 404)
        self.audit.log("order.deleted", None, {"order_id": order_id})
        return {"deleted": True}
