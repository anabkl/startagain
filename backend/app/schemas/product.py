from marshmallow import Schema, fields


class ProductSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    description = fields.String(allow_none=True)
    category = fields.String(required=True)
    price = fields.Float(required=True)
    stock = fields.Integer(required=True)
    image_url = fields.String(allow_none=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
