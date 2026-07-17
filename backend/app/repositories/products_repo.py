from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from app.config.db import get_db


class ProductsRepository:
    def __init__(self) -> None:
        self.col = get_db().products

    def list_paginated(
        self, *, page: int, per_page: int, category: str | None, search: str | None, sort: str
    ):
        query: dict[str, Any] = {"isPublished": {"$ne": False}}
        if category:
            query["category"] = category
        if search:
            query["$text"] = {"$search": search}

        sort_field = "created_at"
        sort_direction = -1
        if sort == "price_asc":
            sort_field, sort_direction = "price", 1
        elif sort == "price_desc":
            sort_field, sort_direction = "price", -1

        projection = {
            "id": 1,
            "name": 1,
            "slug": 1,
            "brand": 1,
            "description": 1,
            "category": 1,
            "price": 1,
            "promoPrice": 1,
            "stock": 1,
            "tags": 1,
            "keywords": 1,
            "isPublished": 1,
            "image_url": 1,
            "created_at": 1,
            "updated_at": 1,
            "sku": 1,
            "ean": 1,
            "size": 1,
            "imageSource": 1,
            "imageRightsStatus": 1,
            "priceVerifiedAt": 1,
            "priceSource": 1,
            "stockVerifiedAt": 1,
            "deliveryEligible": 1,
        }
        skip = (page - 1) * per_page
        cursor = (
            self.col.find(query, projection)
            .sort(sort_field, sort_direction)
            .skip(skip)
            .limit(per_page)
        )
        total = self.col.count_documents(query)
        return list(cursor), total

    def get_by_id(self, product_id: str):
        query: dict[str, Any] = {"$or": [{"id": product_id}, {"slug": product_id}]}
        try:
            query["$or"].append({"_id": ObjectId(product_id)})
        except (InvalidId, TypeError):
            pass
        return self.col.find_one(query)

    def create(self, payload: dict[str, Any]):
        now = datetime.now(timezone.utc)
        payload["created_at"] = now
        payload["updated_at"] = now
        result = self.col.insert_one(payload)
        return self.get_by_id(str(result.inserted_id))

    def update(self, product_id: str, updates: dict[str, Any]):
        updates["updated_at"] = datetime.now(timezone.utc)
        query: dict[str, Any] = {"$or": [{"id": product_id}, {"slug": product_id}]}
        try:
            query["$or"].append({"_id": ObjectId(product_id)})
        except (InvalidId, TypeError):
            pass
        self.col.update_one(query, {"$set": updates})
        return self.get_by_id(product_id)
