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
