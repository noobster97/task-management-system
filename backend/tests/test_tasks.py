from conftest import login, register


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def test_tasks_require_authentication(client):
    response = client.get("/tasks")
    assert response.status_code == 401


def test_user_can_crud_own_task(client):
    register(client)
    token = login(client)

    create_response = client.post(
        "/tasks",
        json={
            "title": "Prepare assessment",
            "description": "Finish CRUD app",
            "priority": "high",
            "due_date": "2026-06-01",
        },
        headers=auth_header(token),
    )
    assert create_response.status_code == 201
    assert create_response.get_json()["priority"] == "high"
    assert create_response.get_json()["due_date"] == "2026-06-01"
    task_id = create_response.get_json()["id"]

    update_response = client.put(
        f"/tasks/{task_id}",
        json={"status": "completed", "priority": "low", "due_date": ""},
        headers=auth_header(token),
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["status"] == "completed"
    assert update_response.get_json()["priority"] == "low"
    assert update_response.get_json()["due_date"] == ""

    list_response = client.get("/tasks", headers=auth_header(token))
    assert list_response.status_code == 200
    assert len(list_response.get_json()) == 1

    delete_response = client.delete(f"/tasks/{task_id}", headers=auth_header(token))
    assert delete_response.status_code == 200


def test_regular_user_cannot_access_other_users_task(client):
    register(client, "first@example.com")
    first_token = login(client, "first@example.com")
    register(client, "second@example.com")
    second_token = login(client, "second@example.com")

    create_response = client.post(
        "/tasks",
        json={"title": "Private task"},
        headers=auth_header(first_token),
    )
    task_id = create_response.get_json()["id"]

    response = client.put(
        f"/tasks/{task_id}",
        json={"status": "completed"},
        headers=auth_header(second_token),
    )
    assert response.status_code == 404


def test_admin_can_see_all_tasks(client):
    register(client, "admin@example.com", role="admin")
    admin_token = login(client, "admin@example.com")
    register(client, "user@example.com")
    user_token = login(client, "user@example.com")

    client.post("/tasks", json={"title": "User task"}, headers=auth_header(user_token))
    response = client.get("/tasks", headers=auth_header(admin_token))

    assert response.status_code == 200
    assert len(response.get_json()) == 1


def test_admin_can_list_users(client):
    register(client, "admin@example.com", role="admin")
    admin_token = login(client, "admin@example.com")
    register(client, "user@example.com")

    response = client.get("/users", headers=auth_header(admin_token))

    assert response.status_code == 200
    assert {user["email"] for user in response.get_json()} == {"admin@example.com", "user@example.com"}


def test_regular_user_cannot_list_users(client):
    register(client)
    token = login(client)

    response = client.get("/users", headers=auth_header(token))

    assert response.status_code == 403


def test_task_validates_priority_and_due_date(client):
    register(client)
    token = login(client)

    priority_response = client.post(
        "/tasks",
        json={"title": "Invalid priority", "priority": "urgent"},
        headers=auth_header(token),
    )
    assert priority_response.status_code == 400

    due_date_response = client.post(
        "/tasks",
        json={"title": "Invalid date", "due_date": "01-06-2026"},
        headers=auth_header(token),
    )
    assert due_date_response.status_code == 400
