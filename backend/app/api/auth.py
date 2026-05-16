from __future__ import annotations

from flask import Blueprint, current_app, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.services.auth_service import AuthService
from app.utils.response import success_response
from app.validators.auth import LoginInput, RegisterInput
from app.validators.common import validate_json

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def get_auth_service() -> AuthService:
    return AuthService()


@auth_bp.post("/register")
def register():
    payload = validate_json(RegisterInput, request)
    user = get_auth_service().register(payload.name, payload.email, payload.password, payload.role)
    data = {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "client"),
        "created_at": user.get("created_at"),
    }
    return success_response(data=data, message="User registered", status=201)


@auth_bp.post("/login")
def login():
    payload = validate_json(LoginInput, request)
    data = get_auth_service().login(payload.email, payload.password)

    response, status = success_response(data=data, message="Login successful")
    response.set_cookie(
        "refresh_token",
        data["refresh_token"],
        httponly=True,
        secure=current_app.config.get("FLASK_ENV") == "production",
        samesite="Lax",
        max_age=14 * 24 * 3600,
    )
    return response, status


@auth_bp.post("/refresh")
@jwt_required(refresh=True, locations=["cookies", "headers"])
def refresh_token():
    identity = get_jwt_identity()
    token = get_auth_service().rotate_refresh(identity)
    response, status = success_response(data=token, message="Token refreshed")
    response.set_cookie(
        "refresh_token",
        token["refresh_token"],
        httponly=True,
        secure=current_app.config.get("FLASK_ENV") == "production",
        samesite="Lax",
        max_age=14 * 24 * 3600,
    )
    return response, status


@auth_bp.post("/logout")
@jwt_required(optional=True)
def logout():
    response, status = success_response(data={"logged_out": True}, message="Logged out")
    response.delete_cookie("refresh_token")
    return response, status


@auth_bp.get("/me")
@jwt_required()
def me():
    identity = get_jwt_identity()
    claims = get_jwt()
    data = get_auth_service().current_user(identity)
    data["token_version"] = claims.get("token_version")
    return success_response(data=data)
