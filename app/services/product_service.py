from sqlalchemy.orm import Session

from app.core.exceptions import PermissionDeniedError, ResourceNotFoundError
from app.models.product import Product
from app.models.role import Role
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, owner: User, data: ProductCreate) -> Product:
    # The owner is the currently authenticated user (from the JWT).
    # `owner_id` is copied from the user, not from the request body -
    # clients can't choose whose product this is.
    product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        owner_id=owner.id,
    )

    return ProductRepository(db).create(product)


def get_product(db: Session, product_id: int) -> Product:
    # Fetch one product; if the id does not exist raise a 404.
    product = ProductRepository(db).get_by_id(product_id)
    if product is None:
        raise ResourceNotFoundError("Product not found")
    return product


def list_products(
    db: Session, owner_id: int | None = None, page: int = 1, limit: int = 5
) -> tuple[list[Product], int]:
    """
    Return one page of products (optionally filtered to one owner) plus
    the total number of matching products for building page controls.
    """
    repo = ProductRepository(db)
    total = repo.count(owner_id=owner_id)
    items = repo.get_all(owner_id=owner_id, skip=(page - 1) * limit, limit=limit)
    return items, total


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    # Apply only the fields the client actually sent (None = unchanged).
    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price

    # Persist the modified object.
    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def delete_product(db: Session, product: Product) -> None:
    ProductRepository(db).delete(product)


def can_manage_product(product: Product, user: User) -> None:
    """
    Permission check: only the owner (or an admin) may edit/delete.
    Anyone else gets a 403.
    """
    if product.owner_id != user.id and user.role != Role.ADMIN:
        raise PermissionDeniedError()
