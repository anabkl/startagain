from __future__ import annotations

from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from flask_jwt_extended import create_access_token, create_refresh_token

from app.repositories.audit_repo import AuditRepository
from app.repositories.users_repo import UsersRepository
from app.utils.errors import AppError


ph = PasswordHasher()


class AuthService:
    MAX_FAILED_ATTEMPTS = 5
    LOCKOUT_MINUTES = 15

    def __init__(self) -> None:
        self.users = UsersRepository()
        self.audit = AuditRepository()

    def register(self, name: str, email: str, password: str, role: str = "client"):
        normalized_email = email.lower().strip()
        if self.users.get_by_email(normalized_email):
            raise AppError("Email already exists", 409)

        user = self.users.create(
            {
                "name": name.strip(),
                "email": normalized_email,
                "password_hash": ph.hash(password),
                "role": role if role == "admin" else "client",
                "failed_logins": 0,
                "locked_until": None,
                "token_version": 0,
            }
        )
        self.audit.log("auth.register", str(user["_id"]), {"email": normalized_email})
        return user

    def _is_locked(self, user: dict) -> bool:
        locked_until = user.get("locked_until")
        return bool(locked_until and locked_until > datetime.now(timezone.utc))

    def _public_user(self, user: dict):
        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "client"),
            "created_at": user.get("created_at"),
        }

    def login(self, email: str, password: str):
        user = self.users.get_by_email(email.lower().strip())
        if not user:
            raise AppError("Invalid credentials", 401)
        if self._is_locked(user):
            raise AppError("Account temporarily locked", 423)

        try:
            ph.verify(user["password_hash"], password)
        except Exception as exc:
            failed = int(user.get("failed_logins", 0)) + 1
            updates = {"failed_logins": failed}
            if failed >= self.MAX_FAILED_ATTEMPTS:
                updates["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=self.LOCKOUT_MINUTES)
            self.users.update_by_id(str(user["_id"]), updates)
            self.audit.log("auth.login_failed", str(user["_id"]), {"email": user["email"], "failed_logins": failed})
            raise AppError("Invalid credentials", 401) from exc

        self.users.update_by_id(str(user["_id"]), {"failed_logins": 0, "locked_until": None})
        refreshed_user = self.users.get_by_id(str(user["_id"]))
        claims = {"role": refreshed_user.get("role", "client"), "token_version": refreshed_user.get("token_version", 0)}
        access_token = create_access_token(identity=str(refreshed_user["_id"]), additional_claims=claims)
        refresh_token = create_refresh_token(identity=str(refreshed_user["_id"]), additional_claims=claims)
        self.audit.log("auth.login_success", str(refreshed_user["_id"]), {"email": refreshed_user["email"]})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": self._public_user(refreshed_user),
        }

    def rotate_refresh(self, user_id: str):
        user = self.users.get_by_id(user_id)
        if not user:
            raise AppError("User not found", 404)

        next_version = int(user.get("token_version", 0)) + 1
        self.users.update_by_id(user_id, {"token_version": next_version})
        user = self.users.get_by_id(user_id)
        claims = {"role": user.get("role", "client"), "token_version": user.get("token_version", 0)}
        return {
            "access_token": create_access_token(identity=user_id, additional_claims=claims),
            "refresh_token": create_refresh_token(identity=user_id, additional_claims=claims),
        }

    def current_user(self, user_id: str):
        user = self.users.get_by_id(user_id)
        if not user:
            raise AppError("User not found", 404)
        return self._public_user(user)
