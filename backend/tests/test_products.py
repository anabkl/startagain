from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.services.product_service import ProductService
from app.validators.product import ProductInput

MINIMAL_PAYLOAD = {
    "name": "Produit Test",
    "category": "Visage",
    "price": 100.0,
    "stock": 5,
}


def test_product_input_accepts_legacy_payload_without_new_fields():
    """Backward compatibility: existing admin payloads must keep validating."""
    product = ProductInput(**MINIMAL_PAYLOAD)

    assert product.sku is None
    assert product.ean is None
    assert product.size is None
    assert product.priceVerifiedAt is None
    assert product.priceSource is None
    assert product.stockVerifiedAt is None


def test_product_input_accepts_verified_source_fields_when_provided():
    verified_at = datetime(2026, 7, 16, tzinfo=timezone.utc)
    product = ProductInput(
        **MINIMAL_PAYLOAD,
        sku="AVENE-CLEANANCE-400",
        ean="3282770203915",
        size="400ml",
        priceVerifiedAt=verified_at,
        priceSource="https://parapharmacie.ma/produit/avene-cleanance-400",
        stockVerifiedAt=verified_at,
    )

    assert product.sku == "AVENE-CLEANANCE-400"
    assert product.ean == "3282770203915"
    assert product.size == "400ml"
    assert product.priceVerifiedAt == verified_at
    assert product.priceSource == "https://parapharmacie.ma/produit/avene-cleanance-400"
    assert product.stockVerifiedAt == verified_at


def test_product_input_still_requires_core_fields():
    with pytest.raises(ValidationError):
        ProductInput(sku="ONLY-SKU-NO-PRICE")


def _normalize(doc):
    # _normalize() is a pure function of its dict argument — bypass
    # ProductService.__init__ so this test never touches a real MongoDB
    # connection.
    service = ProductService.__new__(ProductService)
    return service._normalize(doc)


def test_normalize_never_invents_unverified_fields():
    """A raw Mongo doc without the new fields must normalize to None, not
    a guessed/defaulted value."""
    doc = {"_id": "abc123", "name": "Produit Legacy", "category": "Visage", "price": 100}
    normalized = _normalize(doc)

    assert normalized["sku"] is None
    assert normalized["ean"] is None
    assert normalized["size"] is None
    assert normalized["priceVerifiedAt"] is None
    assert normalized["priceSource"] is None
    assert normalized["stockVerifiedAt"] is None


def test_normalize_passes_through_verified_fields_unchanged():
    verified_at = datetime(2026, 7, 16, tzinfo=timezone.utc)
    doc = {
        "_id": "abc123",
        "name": "Produit Verifie",
        "category": "Visage",
        "price": 100,
        "sku": "SKU-1",
        "ean": "3282770203915",
        "size": "400ml",
        "priceVerifiedAt": verified_at,
        "priceSource": "https://parapharmacie.ma/produit/x",
        "stockVerifiedAt": verified_at,
    }
    normalized = _normalize(doc)

    assert normalized["sku"] == "SKU-1"
    assert normalized["ean"] == "3282770203915"
    assert normalized["size"] == "400ml"
    assert normalized["priceVerifiedAt"] == verified_at
    assert normalized["priceSource"] == "https://parapharmacie.ma/produit/x"
    assert normalized["stockVerifiedAt"] == verified_at
