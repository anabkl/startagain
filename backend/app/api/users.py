from __future__ import annotations

from flask import Blueprint, request

from app.middleware.authz import admin_required
from app.services.user_service import UserService
from app.utils.response import success_response


users_bp = Blueprint("users", __name__, url_prefix="/users")
service = UserService()


@users_bp.get("")
@admin_required
def list_users():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    users, total = service.list_users(page=page, per_page=per_page)
    meta = {"page": page, "per_page": per_page, "total": total, "pages": (total + per_page - 1) // per_page}
    return success_response(data=users, meta=meta)
