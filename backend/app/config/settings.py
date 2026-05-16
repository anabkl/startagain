from __future__ import annotations

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME = os.getenv("APP_NAME", "parapharmacie-api")
    API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
    FLASK_ENV = os.getenv("FLASK_ENV", "production")
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-too")
    JWT_ACCESS_EXPIRES = timedelta(minutes=int(os.getenv("JWT_ACCESS_EXPIRES_MINUTES", "15")))
    JWT_REFRESH_EXPIRES = timedelta(days=int(os.getenv("JWT_REFRESH_EXPIRES_DAYS", "14")))

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "parapharmacie")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    CORS_ORIGINS = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost,http://127.0.0.1").split(",")
        if o.strip()
    ]
    TRUSTED_PROXIES = [
        p.strip() for p in os.getenv("TRUSTED_PROXIES", "127.0.0.1").split(",") if p.strip()
    ]

    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(1024 * 1024)))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    SENTRY_DSN = os.getenv("SENTRY_DSN", "")
