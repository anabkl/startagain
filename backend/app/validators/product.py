from pydantic import BaseModel, Field


class ProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    description: str = Field(default="", max_length=2000)
    category: str = Field(min_length=2, max_length=100)
    price: float = Field(gt=0)
    stock: int = Field(ge=0)
    image_url: str | None = None
