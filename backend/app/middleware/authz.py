from __future__ import annotations

from functools import wraps

from flask_jwt_extended import get_jwt, verify_jwt_in_request

from app.utils.response import error_response


def role_required(*roles: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                return error_response("Forbidden", 403)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def admin_required(fn):
    return role_required("admin")(fn)
