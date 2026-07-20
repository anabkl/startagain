from marshmallow import Schema, fields


class ProductSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    description = fields.String(allow_none=True)
    category = fields.String(required=True)
    price = fields.Float(required=True, allow_none=True)
    stock = fields.Integer(required=True, allow_none=True)
    image_url = fields.String(allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)

    # Optional, backward-compatible product-truth fields. Never generated —
    # only ever set from a real, verified source. See
    # app/validators/product.py for the write-path equivalent.
    sku = fields.String(allow_none=True)
    ean = fields.String(allow_none=True)
    size = fields.String(allow_none=True)
    imageSource = fields.String(allow_none=True)
    imageRightsStatus = fields.String(allow_none=True)
    priceVerifiedAt = fields.DateTime(allow_none=True)
    priceSource = fields.String(allow_none=True)
    stockVerified = fields.Boolean(allow_none=True)
    stockVerifiedAt = fields.DateTime(allow_none=True)
    deliveryEligible = fields.Boolean(allow_none=True)
