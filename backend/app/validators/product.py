from datetime import datetime

from pydantic import BaseModel, Field


class ProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str | None = Field(default=None, max_length=220)
    brand: str | None = Field(default=None, max_length=120)
    description: str = Field(default="", max_length=2000)
    category: str = Field(min_length=2, max_length=100)
    price: float = Field(gt=0)
    promoPrice: float | None = Field(default=None, gt=0)
    stock: int = Field(ge=0)
    tags: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    isPublished: bool = True
    image_url: str | None = None

    # All fields below are optional and default to None/unset so existing
    # admin payloads that omit them keep working unchanged. None of these
    # are ever inferred or generated server-side — the caller (admin UI or
    # a future verified import) must supply a real value, or leave it
    # unset/unverified. See js/business-config.js and
    # js/returns-policy-data.js for the same confirmed/value gating
    # convention used on the frontend.
    sku: str | None = Field(default=None, max_length=64)
    ean: str | None = Field(
        default=None, max_length=14, description="EAN/GTIN barcode. Never generate this value."
    )
    size: str | None = Field(
        default=None, max_length=60, description="Size/format, e.g. '400ml' or '30 comprimés'."
    )
    imageSource: str | None = Field(default=None, max_length=200)
    imageRightsStatus: str | None = Field(default=None, max_length=100)
    priceVerifiedAt: datetime | None = Field(
        default=None, description="When `price` was last confirmed against a real source."
    )
    priceSource: str | None = Field(
        default=None,
        max_length=300,
        description="Where `price` was confirmed (URL or source label).",
    )
    stockVerifiedAt: datetime | None = Field(
        default=None, description="When `stock` was last confirmed against a real source."
    )
    deliveryEligible: bool = Field(
        default=True,
        description="False only once a real, owner-confirmed delivery restriction exists.",
    )
