import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ShippingAddress(BaseModel):
    # Checkout metadata outside this allow-list is intentionally discarded.
    # Delivery pricing and coverage are resolved by OrderService, never from
    # browser-supplied totals or fee flags.
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    whatsapp: str = Field(min_length=10, max_length=20)
    city: str = Field(min_length=2, max_length=80)
    address: str = Field(min_length=5, max_length=200)
    email: EmailStr | None = None
    country_code: Literal["MA"] = "MA"

    @field_validator("email", mode="before")
    @classmethod
    def normalize_optional_email(cls, value: object):
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value

    @field_validator("whatsapp", mode="before")
    @classmethod
    def normalize_moroccan_whatsapp(cls, value: object):
        if not isinstance(value, str):
            raise ValueError("WhatsApp must be a Moroccan mobile number")
        compact = re.sub(r"[\s.\-]", "", value)
        if re.fullmatch(r"0[67]\d{8}", compact):
            return f"+212{compact[1:]}"
        if re.fullmatch(r"\+?212[67]\d{8}", compact):
            return compact if compact.startswith("+") else f"+{compact}"
        raise ValueError("WhatsApp must use a Moroccan 06/07 mobile format")


class OrderItemInput(BaseModel):
    # Legacy clients may still send display-only price/subtotal fields. Ignore
    # them and retain only the product identity and requested quantity.
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    product_id: str = Field(min_length=1, max_length=220)
    quantity: int = Field(ge=1, le=99)

    @field_validator("quantity", mode="before")
    @classmethod
    def reject_boolean_quantity(cls, value: object):
        if isinstance(value, bool):
            raise ValueError("quantity must be an integer, not a boolean")
        return value


class CreateOrderInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: list[OrderItemInput] = Field(min_length=1, max_length=20)
    shipping_address: ShippingAddress
    payment_method: str = Field(default="cod")
    request_id: str = Field(
        min_length=16,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]+$",
    )
