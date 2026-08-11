REGISTER_PROFILE = {
    "full_name": "Alice Doe",
    "phone": "1234567890",
    "bio": "Hello there",
    "location": "New York",
    "age": 30,
    "date_of_birth": "1995-01-15",
}


def register_payload(username, email):
    return {
        "username": username,
        "email": email,
        "password": "secret123",
        "profile": REGISTER_PROFILE,
    }


def test_register_success(client):
    response = client.post("/auth/register", json=register_payload("alice", "alice@example.com"))

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alice"
    assert data["email"] == "alice@example.com"
    assert data["role"] == "USER"
    assert "password" not in data
    assert data["profile"]["full_name"] == "Alice Doe"
    assert data["profile"]["age"] == 30
    assert data["profile"]["date_of_birth"] == "1995-01-15"


def test_register_duplicate_username(client):
    payload = register_payload("dupe", "dupe@example.com")

    assert client.post("/auth/register", json=payload).status_code == 201

    response = client.post("/auth/register", json=payload)
    assert response.status_code == 409
    assert response.json()["detail"] == "Username already exists"


def test_register_duplicate_email(client):
    first = client.post(
        "/auth/register",
        json=register_payload("first", "shared@example.com"),
    )
    assert first.status_code == 201

    second = client.post(
        "/auth/register",
        json=register_payload("second", "shared@example.com"),
    )
    assert second.status_code == 409


def test_login_success(client):
    client.post(
        "/auth/register",
        json=register_payload("login_user", "login@example.com"),
    )

    response = client.post(
        "/auth/login",
        data={"username": "login_user", "password": "secret123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json=register_payload("badpw_user", "badpw@example.com"),
    )

    response = client.post(
        "/auth/login",
        data={"username": "badpw_user", "password": "wrong"},
    )

    assert response.status_code == 401
