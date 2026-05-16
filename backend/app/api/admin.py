from __future__ import annotations

from flask import Blueprint

from app.middleware.authz import admin_required
from app.utils.response import success_response


admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


@admin_bp.get("/analytics")
@admin_required
def analytics_overview():
    return success_response(
        data={
            "sales_today": 0,
            "orders_pending": 0,
            "low_stock": 0,
            "abandoned_carts": 0,
        }
    )
