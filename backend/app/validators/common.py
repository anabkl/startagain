from __future__ import annotations

from typing import Type

from flask import Request
from pydantic import BaseModel, ValidationError

from app.utils.errors import AppError


def validate_json(schema: Type[BaseModel], request: Request):
    payload = request.get_json(silent=True)
    if payload is None:
        raise AppError("Invalid JSON body", 400)
    try:
        return schema.model_validate(payload)
    except ValidationError as exc:
        raise AppError("Validation error", 422, errors=exc.errors()) from exc
