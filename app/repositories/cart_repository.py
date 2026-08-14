from sqlalchemy.orm import Session

from app.models.cart import Cart

class CartRepository:

    
    def __init__(self, db: Session):
        # Keep a reference to the database session for every method.
        self.db = db

    def createCart(self, data: Cart):
        # Stage the new row for insertion...
        self.db.add(data)
        # ...and commit the transaction so it is actually written.
        self.db.commit()
        # Refresh the object so it reflects the DB (gets its `id` etc.).
        self.db.refresh(data)
        return data 