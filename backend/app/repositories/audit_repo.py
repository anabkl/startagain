from __future__ import annotations

from datetime import datetime, timezone

from app.config.db import get_db


class AuditRepository:
    def __init__(self) -> None:
        self.col = get_db().audit_logs

    def log(self, action: str, actor_id: str | None, details: dict):
        self.col.insert_one(
            {
                "action": action,
                "actor_id": actor_id,
                "details": details,
                "created_at": datetime.now(timezone.utc),
            }
        )
