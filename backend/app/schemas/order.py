from marshmallow import Schema, fields


class OrderItemSchema(Schema):
    product_id = fields.String(required=True)
    name = fields.String(required=True)
    quantity = fields.Integer(required=True)
    price = fields.Float(required=True)
    subtotal = fields.Float(required=True)


class OrderSchema(Schema):
    id = fields.String(required=True)
    request_id = fields.String(required=True)
    user_id = fields.String(required=True)
    items = fields.List(fields.Nested(OrderItemSchema), required=True)
    shipping_address = fields.Dict(required=True)
    payment_method = fields.String(required=True)
    status = fields.String(required=True)
    subtotal = fields.Float(required=True)
    delivery_fee = fields.Float(required=True)
    delivery_service_confirmed = fields.Boolean(required=True)
    delivery_notice = fields.String(allow_none=True)
    inventory_reserved = fields.Boolean(required=True)
    order_notice = fields.String(allow_none=True)
    total = fields.Float(required=True)
    created_at = fields.DateTime(required=True)
    updated_at = fields.DateTime(required=True)
