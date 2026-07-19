from __future__ import annotations

from datetime import datetime, timezone
from math import isfinite
import re

from pydantic import BaseModel, Field, field_validator, model_validator

GTIN_LENGTHS = {8, 12, 13, 14}
OWNER_PRICE_SOURCE_PREFIXES = frozenset(
    {"erp", "caisse", "facture", "fournisseur", "catalogue-interne"}
)
OWNER_PRICE_SOURCE_PATTERN = re.compile(
    r"^(erp|caisse|facture|fournisseur|catalogue-interne):" r"[a-z0-9][a-z0-9._/-]{2,127}$",
    re.IGNORECASE,
)


def _valid_gtin_checksum(value: str) -> bool:
    digits = [int(character) for character in value]
    check_digit = digits.pop()
    weighted_sum = sum(
        digit * (3 if index % 2 == 0 else 1) for index, digit in enumerate(reversed(digits))
    )
    return check_digit == (10 - weighted_sum % 10) % 10


def is_owner_price_source(value: object) -> bool:
    if not isinstance(value, str):
        return False
    return OWNER_PRICE_SOURCE_PATTERN.fullmatch(value.strip()) is not None


class ProductTruthFields(BaseModel):
    # These fields stay nullable until the owner supplies evidence. They are
    # never inferred from names, prices, stock quantities, or request time.
    sku: str | None = Field(default=None, max_length=64)
    ean: str | None = Field(default=None, max_length=14)
    size: str | None = Field(default=None, max_length=60)
    imageSource: str | None = Field(default=None, max_length=200)
    imageRightsStatus: str | None = Field(default=None, max_length=100)
    priceVerifiedAt: datetime | None = None
    priceSource: str | None = Field(default=None, max_length=300)
    stockVerified: bool | None = None
    stockVerifiedAt: datetime | None = None
    deliveryEligible: bool | None = None

    @field_validator("ean")
    @classmethod
    def validate_ean(cls, value: str | None):
        if value is None:
            return value
        if not value.isascii() or not value.isdigit() or len(value) not in GTIN_LENGTHS:
            raise ValueError("EAN/GTIN must contain 8, 12, 13, or 14 ASCII digits")
        if not _valid_gtin_checksum(value):
            raise ValueError("EAN/GTIN checksum is invalid")
        return value

    @field_validator("priceSource")
    @classmethod
    def validate_price_source(cls, value: str | None):
        if value is None:
            return value
        value = value.strip()
        if not is_owner_price_source(value):
            allowed = ", ".join(f"{prefix}:" for prefix in sorted(OWNER_PRICE_SOURCE_PREFIXES))
            raise ValueError(f"priceSource must use an owner-controlled prefix: {allowed}")
        return value

    @model_validator(mode="after")
    def validate_truth_consistency(self):
        if (self.priceVerifiedAt is None) != (self.priceSource is None):
            raise ValueError("priceVerifiedAt and priceSource must be supplied together")
        if self.stockVerified is True and self.stockVerifiedAt is None:
            raise ValueError("stockVerifiedAt is required when stockVerified is true")
        if self.stockVerified is not True and self.stockVerifiedAt is not None:
            raise ValueError("stockVerifiedAt requires stockVerified to be true")

        now = datetime.now(timezone.utc)
        for field_name in ("priceVerifiedAt", "stockVerifiedAt"):
            value = getattr(self, field_name)
            if value is None:
                continue
            if value.tzinfo is None or value.utcoffset() is None:
                raise ValueError(f"{field_name} must include an explicit timezone offset")
            normalized = value.astimezone(timezone.utc)
            if normalized > now:
                raise ValueError(f"{field_name} may not be in the future")
        return self


class ProductInput(ProductTruthFields):
    name: str = Field(min_length=2, max_length=180)
    slug: str | None = Field(default=None, max_length=220)
    brand: str | None = Field(default=None, max_length=120)
    description: str = Field(default="", max_length=2000)
    category: str = Field(min_length=2, max_length=100)
    price: float = Field(gt=0, allow_inf_nan=False)
    promoPrice: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    stock: int = Field(ge=0)
    tags: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    isPublished: bool = True
    image_url: str | None = None

    @field_validator("price", "promoPrice", mode="before")
    @classmethod
    def reject_invalid_price_numbers(cls, value: object):
        if value is None:
            return value
        if isinstance(value, bool) or (
            isinstance(value, (int, float)) and not isfinite(float(value))
        ):
            raise ValueError("price values must be finite numbers, not booleans")
        return value

    @field_validator("stock", mode="before")
    @classmethod
    def reject_boolean_stock(cls, value: object):
        if isinstance(value, bool):
            raise ValueError("stock must be an integer, not a boolean")
        return value


class ProductUpdate(ProductTruthFields):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    slug: str | None = Field(default=None, max_length=220)
    brand: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, min_length=2, max_length=100)
    price: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    promoPrice: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    stock: int | None = Field(default=None, ge=0)
    tags: list[str] | None = None
    keywords: list[str] | None = None
    isPublished: bool | None = None
    image_url: str | None = None

    @field_validator("price", "promoPrice", mode="before")
    @classmethod
    def reject_invalid_price_numbers(cls, value: object):
        if value is None:
            return value
        if isinstance(value, bool) or (
            isinstance(value, (int, float)) and not isfinite(float(value))
        ):
            raise ValueError("price values must be finite numbers, not booleans")
        return value

    @field_validator("stock", mode="before")
    @classmethod
    def reject_boolean_stock(cls, value: object):
        if isinstance(value, bool):
            raise ValueError("stock must be an integer, not a boolean")
        return value

    @model_validator(mode="after")
    def validate_patch(self):
        supplied = self.model_fields_set
        if not supplied:
            raise ValueError("At least one product field must be supplied")

        non_nullable = {
            "name",
            "description",
            "category",
            "price",
            "stock",
            "tags",
            "keywords",
            "isPublished",
        }
        null_core_fields = sorted(
            field for field in supplied & non_nullable if getattr(self, field) is None
        )
        if null_core_fields:
            raise ValueError(f"Fields may not be null: {', '.join(null_core_fields)}")

        price_evidence = {"priceVerifiedAt", "priceSource"}
        changes_price = bool(supplied & {"price", "promoPrice"})
        if (supplied & price_evidence or changes_price) and not price_evidence.issubset(supplied):
            raise ValueError(
                "PATCH price changes must supply priceVerifiedAt and priceSource together, "
                "including when clearing"
            )

        stock_evidence = {"stockVerified", "stockVerifiedAt"}
        if (supplied & stock_evidence or "stock" in supplied) and not stock_evidence.issubset(
            supplied
        ):
            raise ValueError(
                "PATCH stock changes must supply stockVerified and stockVerifiedAt together, "
                "including when clearing"
            )
        return self
