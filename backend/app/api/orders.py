from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.middleware.authz import admin_required
from app.services.order_service import OrderService
from app.utils.response import success_response
from app.validators.common import validate_json
from app.validators.order import CreateOrderInput

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


def get_order_service() -> OrderService:
    return OrderService()


@orders_bp.post("")
@jwt_required()
def create_order():
    payload = validate_json(CreateOrderInput, request)
    order = get_order_service().create_order(
        user_id=get_jwt_identity(),
        items=[item.model_dump() for item in payload.items],
        shipping_address=payload.shipping_address.model_dump(),
        payment_method=payload.payment_method,
    )
    return success_response(data=order, message="Order created", status=201)


@orders_bp.get("/me")
@jwt_required()
def list_my_orders():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 10)), 1), 100)
    orders, total = get_order_service().my_orders(
        user_id=get_jwt_identity(), page=page, per_page=per_page
    )
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }
    return success_response(data=orders, meta=meta)


@orders_bp.get("")
@admin_required
def list_all_orders():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 20)), 1), 100)
    status = request.args.get("status")
    orders, total = get_order_service().list_orders(page=page, per_page=per_page, status=status)
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }
    return success_response(data=orders, meta=meta)


@orders_bp.patch("/<order_id>/status")
@admin_required
def update_order_status(order_id: str):
    status = (request.get_json(silent=True) or {}).get("status", "pending")
    order = get_order_service().update_status(order_id, status)
    return success_response(data=order, message="Order status updated")
