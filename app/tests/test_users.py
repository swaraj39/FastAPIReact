def get_token(client, username="bob"):
    client.post(
        "/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": "secret123",
            "profile": {"full_name": f"{username} full"},
        },
    )

    response = client.post(
        "/auth/login",
        data={"username": username, "password": "secret123"},
    )

    return response.json()["access_token"]


def test_profile_requires_token(client):
    response = client.get("/user/profile")
    assert response.status_code == 401


def test_profile(client):
    token = get_token(client)

    response = client.get(
        "/user/profile",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "bob"


def test_dashboard(client):
    token = get_token(client)

    response = client.get(
        "/user/dashboard",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["role"] == "USER"


def test_update_profile(client):
    token = get_token(client)

    response = client.put(
        "/user/update",
        json={
            "username": "bob_updated",
            "bio": "I love testing",
            "location": "Pune",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "bob_updated"
    assert data["profile"]["bio"] == "I love testing"
    assert data["profile"]["location"] == "Pune"


def test_admin_requires_admin_role(client):
    token = get_token(client)

    response = client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


def test_product_crud_flow(client):
    token = get_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    created = client.post(
        "/products",
        json={
            "name": "Laptop",
            "description": "A powerful laptop",
            "price": 999.99,
        },
        headers=headers,
    )

    assert created.status_code == 201
    product = created.json()
    assert product["name"] == "Laptop"
    assert product["owner_id"] == 1
    # MANY-TO-ONE side of the relationship: the product carries its owner.
    assert product["owner"]["username"] == "bob"

    product_id = product["id"]

    listed = client.get("/products", headers=headers)
    assert listed.status_code == 200
    # Paginated response: a wrapper with `items` plus paging metadata.
    body = listed.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1

    fetched = client.get(f"/products/{product_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json()["price"] == 999.99

    updated = client.put(
        f"/products/{product_id}",
        json={"price": 899.99},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["price"] == 899.99

    deleted = client.delete(f"/products/{product_id}", headers=headers)
    assert deleted.status_code == 200

    gone = client.get(f"/products/{product_id}", headers=headers)
    assert gone.status_code == 404


def test_cannot_modify_others_product(client):
    token_a = get_token(client, username="owner_a")
    token_b = get_token(client, username="owner_b")

    created = client.post(
        "/products",
        json={"name": "Phone", "price": 500.0},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    product_id = created.json()["id"]

    response = client.put(
        f"/products/{product_id}",
        json={"price": 1.0},
        headers={"Authorization": f"Bearer {token_b}"},
    )

    assert response.status_code == 403


def test_admin_can_view_user_with_products(client):
    # There is no public "sign up as admin" endpoint, so we create an
    # admin row directly in the database for this test.
    from app.core.security import hash_password
    from app.db.session import SessionLocal
    from app.models.role import Role
    from app.models.user import User

    # A normal user who owns one product.
    token = get_token(client, username="product_owner")
    client.post(
        "/products",
        json={"name": "Mouse", "price": 25.0},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Insert an admin user directly.
    db = SessionLocal()
    admin = User(
        username="admin_x",
        email="admin_x@example.com",
        password=hash_password("x"),
        role=Role.ADMIN,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    admin_id = admin.id
    db.close()

    login = client.post("/auth/login", data={"username": "admin_x", "password": "x"})
    admin_token = login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Find the normal user's id via the admin user list.
    users = client.get("/admin/users", headers=admin_headers).json()
    owner = next(u for u in users if u["username"] == "product_owner")

    # ONE-TO-MANY: fetch the user WITH all their products, eager-loaded
    # via selectinload(User.profile) + selectinload(User.products).
    response = client.get(f"/admin/users/{owner['id']}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "product_owner"
    assert data["profile"] is not None  # one-to-one loaded too
    assert len(data["products"]) == 1   # one-to-many loaded
    assert data["products"][0]["name"] == "Mouse"
    assert "owner" not in data["products"][0]  # ProductSummary omits owner

    assert client.get(
        f"/admin/users/{owner['id']}"
    ).status_code == 401  # missing token -> unauthorized
