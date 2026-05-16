from flask import Blueprint

from app.api.admin import admin_bp
from app.api.auth import auth_bp
from app.api.health import health_bp
from app.api.orders import orders_bp
from app.api.products import products_bp
from app.api.users import users_bp


def create_api_blueprint() -> Blueprint:
    bp = Blueprint("api", __name__)
    bp.register_blueprint(auth_bp)
    bp.register_blueprint(products_bp)
    bp.register_blueprint(orders_bp)
    bp.register_blueprint(admin_bp)
    bp.register_blueprint(users_bp)
    bp.register_blueprint(health_bp)
    return bp
