from __future__ import annotations

import time
import uuid

from flask import Flask, g, request


def register_request_context(app: Flask) -> None:
    @app.before_request
    def _before_request():
        g.request_id = str(uuid.uuid4())
        g.start_time = time.perf_counter()

    @app.after_request
    def _after_request(response):
        duration_ms = int((time.perf_counter() - g.get("start_time", time.perf_counter())) * 1000)
        response.headers["X-Request-ID"] = g.get("request_id", "")
        app.logger.info(
            "request_completed",
            extra={
                "request_id": g.get("request_id"),
                "method": request.method,
                "path": request.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "ip": request.remote_addr,
            },
        )
        return response
