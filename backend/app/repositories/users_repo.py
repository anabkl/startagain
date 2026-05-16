from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.config.db import get_db


class UsersRepository:
    def __init__(self) -> None:
        self.col = get_db().users

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        payload["created_at"] = datetime.now(timezone.utc)
        payload["updated_at"] = payload["created_at"]
        result = self.col.insert_one(payload)
        return self.get_by_id(str(result.inserted_id))

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        return self.col.find_one({"email": email.lower().strip()})

    def get_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self.col.find_one({"_id": ObjectId(user_id)})

    def update_by_id(self, user_id: str, updates: dict[str, Any]) -> None:
        updates["updated_at"] = datetime.now(timezone.utc)
        self.col.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    def list_paginated(self, page: int, per_page: int):
        skip = (page - 1) * per_page
        cursor = (
            self.col.find({}, {"password_hash": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(per_page)
        )
        total = self.col.count_documents({})
        return list(cursor), total
