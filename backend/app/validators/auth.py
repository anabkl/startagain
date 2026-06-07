from pydantic import BaseModel, EmailStr, Field


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="client")
    whatsapp: str | None = Field(default=None, max_length=24)
    city: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, max_length=220)


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    rememberMe: bool = False
