from __future__ import annotations

from argon2 import PasswordHasher

from app.repositories.orders_repo import OrdersRepository
from app.repositories.users_repo import UsersRepository
from app.utils.errors import AppError

ph = PasswordHasher()


class UserService:
    def __init__(self) -> None:
        self.repo = UsersRepository()
        self.orders = OrdersRepository()

    def _serialize_user(self, item: dict):
        return {
            "id": str(item["_id"]),
            "name": item.get("name", ""),
            "email": item.get("email", ""),
            "role": item.get("role", "client"),
            "whatsapp": item.get("whatsapp") or item.get("phone") or "",
            "phone": item.get("phone") or item.get("whatsapp") or "",
            "city": item.get("city", ""),
            "address": item.get("address", ""),
            "photoURL": item.get("photoURL") or item.get("photo_url") or "",
            "preferences": item.get("preferences") or {"lang": "ar", "theme": "light"},
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
        }

    def _serialize_order(self, item: dict):
        status = item.get("status", "pending")
        if status == "في الانتظار":
            status = "pending"

        return {
            "id": str(item["_id"]),
            "items": item.get("items", []),
            "shipping_address": item.get("shipping_address", {}),
            "payment_method": item.get("payment_method", "cod"),
            "status": status,
            "total": float(item.get("total", 0) or 0),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
        }

    def list_users(self, page: int, per_page: int):
        docs, total = self.repo.list_paginated(page=page, per_page=per_page)
        users = [self._serialize_user(item) for item in docs]
        return users, total

    def get_profile(self, user_id: str):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise AppError("User not found", 404)
        return self._serialize_user(user)

    def update_profile(self, user_id: str, payload: dict):
        allowed = {
            "name",
            "whatsapp",
            "phone",
            "city",
            "address",
            "photoURL",
            "photo_url",
        }
        updates = {
            key: value.strip() if isinstance(value, str) else value
            for key, value in payload.items()
            if key in allowed
        }
        if "whatsapp" in updates and "phone" not in updates:
            updates["phone"] = updates["whatsapp"]
        if "phone" in updates and "whatsapp" not in updates:
            updates["whatsapp"] = updates["phone"]
        if not updates:
            return self.get_profile(user_id)
        self.repo.update_by_id(user_id, updates)
        return self.get_profile(user_id)

    def update_preferences(self, user_id: str, preferences: dict):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise AppError("User not found", 404)

        current = user.get("preferences") or {}
        updates = {}
        if preferences.get("lang") in {"ar", "en"}:
            updates["lang"] = preferences["lang"]
        if preferences.get("theme") in {"light", "dark"}:
            updates["theme"] = preferences["theme"]
        if not updates:
            return self._serialize_user(user)

        current.update(updates)
        self.repo.update_by_id(user_id, {"preferences": current})
        return self.get_profile(user_id)

    def change_password(self, user_id: str, old_password: str, new_password: str):
        user = self.repo.get_by_id(user_id)
        if not user:
            raise AppError("User not found", 404)
        if len(new_password or "") < 8:
            raise AppError("Password must be at least 8 characters", 422)

        try:
            ph.verify(user["password_hash"], old_password)
        except Exception as exc:
            raise AppError("Current password is incorrect", 401) from exc

        self.repo.update_by_id(user_id, {"password_hash": ph.hash(new_password)})
        return {"changed": True}

    def dashboard(self, user_id: str):
        user = self.get_profile(user_id)
        docs, total = self.orders.list_for_user(user_id=user_id, page=1, per_page=50)
        return {
            "user": user,
            "orders": [self._serialize_order(item) for item in docs],
            "ordersTotal": total,
        }
