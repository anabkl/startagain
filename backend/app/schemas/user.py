from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.String(required=True)
    name = fields.String(required=True)
    email = fields.Email(required=True)
    role = fields.String(required=True)
    created_at = fields.DateTime(required=True)
