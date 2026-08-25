import os
import sys

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "sqlite:///./test.db"
)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def clean_tables():
    from app.db.base import Base
    from app.db.session import SessionLocal, engine
    from app.models.cart import CartItem
    from app.models.orders import Orders
    from app.models.product import Product
    from app.models.profile import Profile
    from app.models.user import User

    # Ensure every table exists even when test.db was deleted or is
    # missing newer columns - create_all() only ADDS what is absent.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    db.query(CartItem).delete()
    db.query(Orders).delete()
    db.query(Product).delete()
    db.query(Profile).delete()
    db.query(User).delete()
    db.commit()
    db.close()

    yield
