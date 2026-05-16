from __future__ import annotations

import json
import logging
from logging.handlers import RotatingFileHandler


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging(level: str = "INFO") -> None:
    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()

    stream = logging.StreamHandler()
    stream.setFormatter(JsonFormatter())

    file_handler = RotatingFileHandler("backend/logs/app.log", maxBytes=5 * 1024 * 1024, backupCount=5)
    file_handler.setFormatter(JsonFormatter())

    root.addHandler(stream)
    root.addHandler(file_handler)
