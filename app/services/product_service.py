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
        quantity=data.quantity
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


def stamp_favorites(db: Session, user: User, products: list[Product]) -> list[Product]:
    """
    Set the transient `is_favorited` attribute on each product based on
    the current user's favorites. Pydantic picks it up when serializing
    ProductResponse (many-to-many). This is NOT persisted.
    """
    favorite_ids = ProductRepository(db).get_favorite_ids(user.id)
    for product in products:
        product.is_favorited = product.id in favorite_ids
    return products


def add_favorite(db: Session, user: User, product: Product) -> None:
    """
    MANY-TO-MANY: link this user to this product in the association
    table. `product in user.favorite_products` is an idempotent guard -
    adding twice does nothing.
    """
    if product not in user.favorite_products:
        user.favorite_products.append(product)
        db.commit()


def remove_favorite(db: Session, user: User, product: Product) -> None:
    """
    Unlink the user from the product. Removing a product that was never
    favorited is harmless.
    """
    if product in user.favorite_products:
        user.favorite_products.remove(product)
        db.commit()


def list_favorites(
    db: Session, user: User, page: int = 1, limit: int = 5
) -> tuple[list[Product], int]:
    """
    One page of the user's favorited products (all stamped is_favorited
    = True) plus the total, mirroring list_products.
    """
    repo = ProductRepository(db)
    total = repo.count_favorites(user.id)
    items = repo.get_favorites(user.id, skip=(page - 1) * limit, limit=limit)
    for product in items:
        product.is_favorited = True
    return items, total
