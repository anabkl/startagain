from __future__ import annotations

from app.repositories.audit_repo import AuditRepository
from app.repositories.orders_repo import OrdersRepository
from app.repositories.products_repo import ProductsRepository
from app.utils.errors import AppError


class OrderService:
    def __init__(self) -> None:
        self.orders = OrdersRepository()
        self.products = ProductsRepository()
        self.audit = AuditRepository()

    def _normalize(self, doc: dict):
        return {
            "id": str(doc["_id"]),
            "user_id": doc.get("user_id"),
            "items": doc.get("items", []),
            "shipping_address": doc.get("shipping_address", {}),
            "payment_method": doc.get("payment_method", "cod"),
            "status": doc.get("status", "pending"),
            "total": float(doc.get("total", 0)),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }

    def create_order(self, *, user_id: str, items: list[dict], shipping_address: dict, payment_method: str):
        if not items:
            raise AppError("Order items cannot be empty", 422)

        order_items = []
        total = 0.0
        for item in items:
            product = self.products.get_by_id(item["product_id"])
            if not product:
                raise AppError(f"Product not found: {item['product_id']}", 404)
            qty = int(item["quantity"])
            stock = int(product.get("stock", 0))
            if qty > stock:
                raise AppError(f"Insufficient stock for {product.get('name')}", 409)

            price = float(product.get("price", 0))
            subtotal = round(price * qty, 2)
            total += subtotal
            order_items.append(
                {
                    "product_id": str(product["_id"]),
                    "name": product.get("name"),
                    "quantity": qty,
                    "price": price,
                    "subtotal": subtotal,
                }
            )

        order = self.orders.create(
            {
                "user_id": user_id,
                "items": order_items,
                "shipping_address": shipping_address,
                "payment_method": payment_method,
                "status": "pending",
                "total": round(total, 2),
            }
        )
        self.audit.log("order.created", user_id, {"order_id": str(order["_id"]), "total": order["total"]})
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
