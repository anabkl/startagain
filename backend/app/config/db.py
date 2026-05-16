from __future__ import annotations

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.config.settings import Settings


_client: MongoClient | None = None
_db: Database | None = None


def init_db() -> Database:
    global _client, _db
    settings = Settings()
    if _db is not None:
        return _db

    _client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    _db = _client[settings.MONGO_DB_NAME]
    ensure_indexes(_db)
    return _db


def get_db() -> Database:
    if _db is None:
        return init_db()
    return _db


def ensure_indexes(db: Database) -> None:
    db.users.create_index([("email", ASCENDING)], unique=True, name="uniq_users_email")
    db.products.create_index([("name", ASCENDING)], name="idx_products_name")
    db.products.create_index([("category", ASCENDING)], name="idx_products_category")
    db.orders.create_index([("created_at", DESCENDING)], name="idx_orders_created_at")
    db.orders.create_index([("status", ASCENDING)], name="idx_orders_status")
