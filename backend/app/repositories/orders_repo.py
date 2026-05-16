from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.config.db import get_db


class OrdersRepository:
    def __init__(self) -> None:
        self.col = get_db().orders

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        payload["created_at"] = now
        payload["updated_at"] = now
        result = self.col.insert_one(payload)
        return self.get_by_id(str(result.inserted_id))

    def get_by_id(self, order_id: str) -> dict[str, Any] | None:
        return self.col.find_one({"_id": ObjectId(order_id)})

    def list_for_user(self, user_id: str, page: int, per_page: int):
        query = {"user_id": user_id}
        skip = (page - 1) * per_page
        cursor = self.col.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        total = self.col.count_documents(query)
        return list(cursor), total

    def list_all(self, page: int, per_page: int, status: str | None = None):
        query: dict[str, Any] = {}
        if status:
            query["status"] = status
        skip = (page - 1) * per_page
        cursor = self.col.find(query).sort("created_at", -1).skip(skip).limit(per_page)
        total = self.col.count_documents(query)
        return list(cursor), total

    def update_status(self, order_id: str, status: str):
        self.col.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}},
        )
        return self.get_by_id(order_id)
