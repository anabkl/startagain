from pydantic import BaseModel, Field


class ShippingAddress(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    whatsapp: str = Field(min_length=10, max_length=20)
    city: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=200)
    email: str | None = None


class OrderItemInput(BaseModel):
    product_id: str
    quantity: int = Field(ge=1, le=99)


class CreateOrderInput(BaseModel):
    items: list[OrderItemInput]
    shipping_address: ShippingAddress
    payment_method: str = Field(default="cod")
