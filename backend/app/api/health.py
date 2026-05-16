from __future__ import annotations

from flask import Blueprint

from app.config.db import get_db
from app.utils.response import success_response

health_bp = Blueprint("health", __name__, url_prefix="/health")


@health_bp.get("")
def health_check():
    db = get_db()
    db.command("ping")
    return success_response(data={"status": "healthy", "database": "ok"})
