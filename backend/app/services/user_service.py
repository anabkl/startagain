from __future__ import annotations

from app.repositories.users_repo import UsersRepository


class UserService:
    def __init__(self) -> None:
        self.repo = UsersRepository()

    def list_users(self, page: int, per_page: int):
        docs, total = self.repo.list_paginated(page=page, per_page=per_page)
        users = [
            {
                "id": str(item["_id"]),
                "name": item.get("name"),
                "email": item.get("email"),
                "role": item.get("role", "client"),
                "created_at": item.get("created_at"),
            }
            for item in docs
        ]
        return users, total
