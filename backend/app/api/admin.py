from __future__ import annotations

from datetime import datetime, time, timezone

from flask import Blueprint

from app.config.db import get_db
from app.middleware.authz import admin_required
from app.utils.response import success_response

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _start_of_today_utc() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime.combine(now.date(), time.min, tzinfo=timezone.utc)


def _today_stats():
    db = get_db()
    start = _start_of_today_utc()
    today_orders = list(db.orders.find({"created_at": {"$gte": start}}))
    revenue = sum(float(order.get("total", 0) or 0) for order in today_orders)
    pending_orders = db.orders.count_documents({"status": {"$in": ["pending", "في الانتظار"]}})
    low_stock = db.products.count_documents({"stock": {"$lte": 5}})
    new_clients = db.users.count_documents(
        {"created_at": {"$gte": start}, "role": {"$in": ["client", "user"]}}
    )

    return {
        "todayRevenue": round(revenue, 2),
        "newOrders": len(today_orders),
        "newClients": new_clients,
        "sales_today": round(revenue, 2),
        "orders_pending": pending_orders,
        "low_stock": low_stock,
        "abandoned_carts": 0,
    }


@admin_bp.get("/analytics")
@admin_required
def analytics_overview():
    return success_response(data=_today_stats())


@admin_bp.get("/statistics/today")
@admin_required
def today_statistics():
    return success_response(data=_today_stats())
