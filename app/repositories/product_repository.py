from sqlalchemy.orm import Session, selectinload

from app.models.product import Product


class ProductRepository:
    """
    All database queries related to Product live here.

    Why `selectinload`?
    --------------------
    By default SQLAlchemy relationships are LAZY: `product.owner` is only
    fetched when you touch the attribute. If you return 100 products and
    the API serializes each owner, SQLAlchemy runs 1 query for products
    + 100 tiny queries for owners = the N+1 problem.

    `.options(selectinload(...))` turns that relationship EAGER: one
    extra `WHERE products.owner_id IN (...)` query loads every owner at
    once, then SQLAlchemy wires them up in memory. 2 queries total.
    """

    def __init__(self, db: Session):
        # Keep a reference to the database session for every method.
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        # Fetch ONE product and eager-load its owner.
        return (
            self.db.query(Product)
            .options(selectinload(Product.owner))
            .filter(Product.id == product_id)
            .first()  # .first() -> None if nothing matches
        )

    def get_all(
        self, owner_id: int | None = None, skip: int = 0, limit: int = 100
    ) -> list[Product]:
        # Start a query for ALL products.
        query = self.db.query(Product).options(selectinload(Product.owner))

        # Optional filter: if owner_id is given, only return products
        # owned by that user (used by /products?owner_id=...).
        if owner_id is not None:
            query = query.filter(Product.owner_id == owner_id)

        # Pagination: `offset(skip)` skips rows of earlier pages and
        # `limit(limit)` caps how many rows this page returns.
        return query.offset(skip).limit(limit).all()

    def count(self, owner_id: int | None = None) -> int:
        # How many products match AFTER filters but BEFORE pagination; the
        # client uses this to compute how many pages there are.
        query = self.db.query(Product)
        if owner_id is not None:
            query = query.filter(Product.owner_id == owner_id)
        return query.count()

    def create(self, product: Product) -> Product:
        # Stage the new row for insertion...
        self.db.add(product)
        # ...and commit the transaction so it is actually written.
        self.db.commit()
        # Refresh the object so it reflects the DB (gets its `id` etc.).
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        # Delete the row and commit immediately.
        self.db.delete(product)
        self.db.commit()
