from conftest import register


def test_register_and_login(client):
    response = register(client)
    assert response.status_code == 201
    assert response.get_json()["user"]["email"] == "user@example.com"

    login_response = client.post(
        "/auth/login",
        json={"email": "user@example.com", "password": "secret123"},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.get_json()


def test_register_validates_duplicate_email(client):
    register(client)
    response = register(client)
    assert response.status_code == 409
