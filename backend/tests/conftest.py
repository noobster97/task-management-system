import pytest

from app import create_app
from app.models import db


class TestConfig:
    TESTING = True
    JWT_SECRET_KEY = "test-jwt-secret-with-enough-length"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://localhost:5173"]


@pytest.fixture()
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
    return app.test_client()


def register(client, email="user@example.com", password="secret123", role="user"):
    return client.post("/auth/register", json={"email": email, "password": password, "role": role})


def login(client, email="user@example.com", password="secret123"):
    response = client.post("/auth/login", json={"email": email, "password": password})
    return response.get_json()["access_token"]
