from __future__ import annotations

from app.repositories.products_repo import ProductsRepository
from app.utils.errors import AppError


class ProductService:
    def __init__(self) -> None:
        self.repo = ProductsRepository()

    def _normalize(self, doc: dict):
        return {
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "description": doc.get("description", ""),
            "category": doc.get("category", ""),
            "price": float(doc.get("price", 0)),
            "stock": int(doc.get("stock", 0)),
            "image_url": doc.get("image_url"),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
        }

    def list_products(
        self, page: int, per_page: int, category: str | None, search: str | None, sort: str
    ):
        docs, total = self.repo.list_paginated(
            page=page, per_page=per_page, category=category, search=search, sort=sort
        )
        return [self._normalize(item) for item in docs], total

    def get_product(self, product_id: str):
        product = self.repo.get_by_id(product_id)
        if not product:
            raise AppError("Product not found", 404)
        return self._normalize(product)

    def create_product(self, payload: dict):
        product = self.repo.create(payload)
        return self._normalize(product)

    def update_product(self, product_id: str, payload: dict):
        updated = self.repo.update(product_id, payload)
        if not updated:
            raise AppError("Product not found", 404)
        return self._normalize(updated)
