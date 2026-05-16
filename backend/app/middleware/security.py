from __future__ import annotations

from flask import Flask, request


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "style-src 'self' 'unsafe-inline' https:; "
        "script-src 'self' https:; "
        "connect-src 'self' https:; "
        "frame-ancestors 'none';"
    ),
}


def apply_security_headers(app: Flask) -> None:
    @app.after_request
    def _after_request(response):
        for key, value in SECURITY_HEADERS.items():
            response.headers[key] = value
        return response


def suspicious_request_logger(app: Flask) -> None:
    @app.before_request
    def _inspect_request():
        if request.content_length and request.content_length > app.config.get(
            "MAX_CONTENT_LENGTH", 1024 * 1024
        ):
            app.logger.warning(
                "oversized_request",
                extra={
                    "path": request.path,
                    "size": request.content_length,
                    "ip": request.remote_addr,
                },
            )
        query = request.query_string.decode("utf-8", errors="ignore").lower()
        if any(token in query for token in ("<script", "union select", "../", "%00")):
            app.logger.warning(
                "suspicious_query",
                extra={"path": request.path, "query": query, "ip": request.remote_addr},
            )
