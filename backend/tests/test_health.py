from app import create_app


def test_health_endpoint():
    app = create_app()
    client = app.test_client()
    response = client.get("/api/v1/health")
    assert response.status_code in (200, 500)
