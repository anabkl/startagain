from __future__ import annotations

from flask import jsonify


def success_response(data=None, message: str = "OK", status: int = 200, meta=None):
    body = {"success": True, "message": message, "data": data}
    if meta is not None:
        body["meta"] = meta
    return jsonify(body), status


def error_response(message: str = "Error", status: int = 400, errors=None):
    body = {"success": False, "message": message}
    if errors is not None:
        body["errors"] = errors
    return jsonify(body), status
