from app import create_app


def test_health_endpoint(monkeypatch):
    from app.api import health as health_module

    class FakeDb:
        @staticmethod
        def command(_):
            return {"ok": 1}

    monkeypatch.setattr(health_module, "get_db", lambda: FakeDb())

    app = create_app()
    client = app.test_client()
    response = client.get("/api/v1/health")
    assert response.status_code == 200
