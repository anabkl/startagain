from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.middleware.authz import admin_required
from app.services.user_service import UserService
from app.utils.response import success_response

users_bp = Blueprint("users", __name__, url_prefix="/users")


def get_user_service() -> UserService:
    return UserService()


@users_bp.get("")
@admin_required
def list_users():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    users, total = get_user_service().list_users(page=page, per_page=per_page)
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }
    return success_response(data=users, meta=meta)


@users_bp.get("/me/dashboard")
@jwt_required()
def my_dashboard():
    return success_response(data=get_user_service().dashboard(get_jwt_identity()))


@users_bp.patch("/me")
@jwt_required()
def update_me():
    payload = request.get_json(silent=True) or {}
    return success_response(data=get_user_service().update_profile(get_jwt_identity(), payload))


@users_bp.patch("/preferences")
@jwt_required()
def update_preferences():
    payload = request.get_json(silent=True) or {}
    return success_response(data=get_user_service().update_preferences(get_jwt_identity(), payload))


@users_bp.post("/me/password")
@jwt_required()
def update_password():
    payload = request.get_json(silent=True) or {}
    data = get_user_service().change_password(
        get_jwt_identity(),
        payload.get("oldPassword", ""),
        payload.get("newPassword", ""),
    )
    return success_response(data=data, message="Password updated")
