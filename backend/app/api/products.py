from __future__ import annotations

from flask import Blueprint, request
from app.middleware.authz import admin_required
from app.services.product_service import ProductService
from app.utils.response import success_response
from app.validators.common import validate_json
from app.validators.product import ProductInput

products_bp = Blueprint("products", __name__, url_prefix="/products")


def get_product_service() -> ProductService:
    return ProductService()


@products_bp.get("")
def list_products():
    page = max(int(request.args.get("page", 1)), 1)
    per_page = min(max(int(request.args.get("per_page", 12)), 1), 100)
    category = request.args.get("category")
    search = request.args.get("search")
    sort = request.args.get("sort", "newest")

    products, total = get_product_service().list_products(
        page=page, per_page=per_page, category=category, search=search, sort=sort
    )
    meta = {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }
    return success_response(data=products, meta=meta)


@products_bp.get("/<product_id>")
def get_product(product_id: str):
    return success_response(data=get_product_service().get_product(product_id))


@products_bp.post("")
@admin_required
def create_product():
    payload = validate_json(ProductInput, request)
    product = get_product_service().create_product(payload.model_dump())
    return success_response(data=product, message="Product created", status=201)


@products_bp.patch("/<product_id>")
@admin_required
def update_product(product_id: str):
    payload = validate_json(ProductInput, request)
    product = get_product_service().update_product(product_id, payload.model_dump())
    return success_response(data=product, message="Product updated")
