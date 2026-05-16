from __future__ import annotations

import sentry_sdk
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix

from app.api import create_api_blueprint
from app.config.logging import configure_logging
from app.config.settings import Settings
from app.middleware.request_context import register_request_context
from app.middleware.security import apply_security_headers, suspicious_request_logger
from app.utils.errors import AppError
from app.utils.response import error_response


jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)


def create_app() -> Flask:
    settings = Settings()
    configure_logging(settings.LOG_LEVEL)

    if settings.SENTRY_DSN:
        sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)

    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=settings.SECRET_KEY,
        JWT_SECRET_KEY=settings.JWT_SECRET_KEY,
        JWT_ACCESS_TOKEN_EXPIRES=settings.JWT_ACCESS_EXPIRES,
        JWT_REFRESH_TOKEN_EXPIRES=settings.JWT_REFRESH_EXPIRES,
        JWT_TOKEN_LOCATION=["headers", "cookies"],
        JWT_COOKIE_SECURE=settings.FLASK_ENV == "production",
        JWT_COOKIE_SAMESITE="Lax",
        JWT_COOKIE_CSRF_PROTECT=True,
        MAX_CONTENT_LENGTH=settings.MAX_CONTENT_LENGTH,
    )

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

    CORS(
        app,
        resources={f"{settings.API_PREFIX}/*": {"origins": settings.CORS_ORIGINS}},
        supports_credentials=True,
    )

    jwt.init_app(app)
    limiter.init_app(app)

    register_request_context(app)
    apply_security_headers(app)
    suspicious_request_logger(app)

    api_bp = create_api_blueprint()
    app.register_blueprint(api_bp, url_prefix=settings.API_PREFIX)

    @app.errorhandler(AppError)
    def handle_app_error(error: AppError):
        return error_response(error.message, error.status_code, error.errors)

    @app.errorhandler(404)
    def not_found(_):
        return error_response("Resource not found", 404)

    @app.errorhandler(429)
    def rate_limited(_):
        return error_response("Too many requests", 429)

    @app.errorhandler(Exception)
    def unhandled_error(error: Exception):
        app.logger.exception("unhandled_exception")
        return error_response("Internal server error", 500)

    return app
