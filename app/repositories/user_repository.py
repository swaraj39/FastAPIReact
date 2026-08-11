from sqlalchemy.orm import Session, selectinload

from app.models.user import User


class UserRepository:
    """
    All database queries related to User live here.

    `get_with_details` demonstrates eager loading of BOTH relationship
    kinds at once:
      * selectinload(User.profile)   -> one-to-one
      * selectinload(User.products)  -> one-to-many
    Without these, accessing `user.products` later would fire extra
    queries (N+1). With them, everything is fetched in 3 queries total.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        # Simplest lookup: one row by primary key.
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> User | None:
        # Lookup by the unique username column.
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str) -> User | None:
        # Lookup by the unique email column.
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self) -> list[User]:
        # Return every user row.
        return self.db.query(User).all()

    def get_with_details(self, user_id: int) -> User | None:
        """
        Fetch a single user WITH their profile (one-to-one) and their
        products (one-to-many) already loaded, to avoid N+1 queries.

        `selectinload` runs a second SELECT that loads all related rows
        in one go, then SQLAlchemy joins them in memory.
        """
        return (
            self.db.query(User)
            .options(
                selectinload(User.profile),   # one-to-one: eager load profile
                selectinload(User.products),  # one-to-many: eager load products
            )
            .filter(User.id == user_id)
            .first()
        )

    def create(self, user: User) -> User:
        # Insert the new user (its Profile row is attached via the
        # relationship and gets inserted too) and commit.
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        # Delete the row. Cascade rules delete the user's Profile and
        # Products as well (defined on the User.relationships).
        self.db.delete(user)
        self.db.commit()
