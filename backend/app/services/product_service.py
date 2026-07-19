from __future__ import annotations

from datetime import datetime, timedelta, timezone
from math import isfinite

from app.repositories.products_repo import ProductsRepository
from app.utils.errors import AppError
from app.validators.product import is_owner_price_source

PRICE_VERIFICATION_MAX_AGE = timedelta(days=30)
STOCK_VERIFICATION_MAX_AGE = timedelta(hours=24)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _evidence_is_current(
    verified_at: object, *, max_age: timedelta, now: datetime | None = None
) -> bool:
    if not isinstance(verified_at, datetime):
        return False
    current_time = _as_utc(now or datetime.now(timezone.utc))
    age = current_time - _as_utc(verified_at)
    return timedelta(0) <= age <= max_age


def has_current_price_evidence(doc: dict, *, now: datetime | None = None) -> bool:
    verified_at = doc.get("priceVerifiedAt")
    source = doc.get("priceSource")
    price = doc.get("price")
    if (
        not is_owner_price_source(source)
        or isinstance(price, bool)
        or not isinstance(price, (int, float))
        or not isfinite(float(price))
        or price <= 0
    ):
        return False
    return _evidence_is_current(verified_at, max_age=PRICE_VERIFICATION_MAX_AGE, now=now)


def get_effective_verified_price(doc: dict, *, now: datetime | None = None) -> float | None:
    if not has_current_price_evidence(doc, now=now):
        return None

    base_price = float(doc["price"])
    promo_price = doc.get("promoPrice")
    if (
        not isinstance(promo_price, bool)
        and isinstance(promo_price, (int, float))
        and isfinite(float(promo_price))
        and 0 < promo_price < base_price
    ):
        return float(promo_price)
    return base_price


def has_current_stock_evidence(doc: dict, *, now: datetime | None = None) -> bool:
    stock = doc.get("stock")
    if (
        doc.get("stockVerified") is not True
        or isinstance(stock, bool)
        or not isinstance(stock, int)
        or stock < 0
    ):
        return False
    return _evidence_is_current(
        doc.get("stockVerifiedAt"), max_age=STOCK_VERIFICATION_MAX_AGE, now=now
    )


class ProductService:
    def __init__(self) -> None:
        self.repo = ProductsRepository()

    def _normalize(self, doc: dict):
        # Fields below (sku..deliveryEligible) are passed through as-is, or
        # None when absent. They are never derived, defaulted to a
        # non-null value, or otherwise inferred here — an absent value
        # means "not verified," and must stay that way until a real
        # source sets it via the write path (app/validators/product.py).
        current_time = datetime.now(timezone.utc)
        effective_price = get_effective_verified_price(doc, now=current_time)
        has_verified_stock = has_current_stock_evidence(doc, now=current_time)
        price = float(doc["price"]) if effective_price is not None else None
        promo_price = (
            effective_price if effective_price is not None and effective_price < price else None
        )
        stock = int(doc["stock"]) if has_verified_stock else None

        return {
            "id": doc.get("id") or str(doc["_id"]),
            "name": doc.get("name", ""),
            "slug": doc.get("slug") or doc.get("id") or str(doc["_id"]),
            "brand": doc.get("brand", ""),
            "description": doc.get("description", ""),
            "category": doc.get("category", ""),
            "price": price,
            "promoPrice": promo_price,
            "stock": stock,
            "tags": doc.get("tags", []),
            "keywords": doc.get("keywords", []),
            "isPublished": doc.get("isPublished") is True,
            "image_url": doc.get("image_url"),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
            "sku": doc.get("sku"),
            "ean": doc.get("ean"),
            "size": doc.get("size"),
            "imageSource": doc.get("imageSource"),
            "imageRightsStatus": doc.get("imageRightsStatus"),
            "priceVerifiedAt": doc.get("priceVerifiedAt"),
            "priceSource": doc.get("priceSource"),
            "stockVerified": doc.get("stockVerified"),
            "stockVerifiedAt": doc.get("stockVerifiedAt"),
            "deliveryEligible": doc.get("deliveryEligible"),
        }

    def list_products(
        self, page: int, per_page: int, category: str | None, search: str | None, sort: str
    ):
        docs, total = self.repo.list_paginated(
            page=page, per_page=per_page, category=category, search=search, sort=sort
        )
        return [self._normalize(item) for item in docs], total

    def get_product(self, product_id: str):
        product = self.repo.get_public_by_id(product_id)
        if not product:
            raise AppError("Product not found", 404)
        return self._normalize(product)

    def create_product(self, payload: dict):
        product = self.repo.create(payload)
        return self._normalize(product)

    def update_product(self, product_id: str, payload: dict):
        updated = self.repo.update(product_id, payload)
        if not updated:
            raise AppError("Product not found", 404)
        return self._normalize(updated)
