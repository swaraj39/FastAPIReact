

from sqlalchemy.orm import Session
from app.models.orders import Orders


class OrderRepository:


    def __init__(self, db: Session):
        # Keep a reference to the database session for every method.
        self.db = db

    
    
    def createOrder(self, data: Orders):
        # Stage the new row for insertion...
        self.db.add(data)
        # ...and commit the transaction so it is actually written.
        self.db.commit()
        # Refresh the object so it reflects the DB (gets its `id` etc.).
        self.db.refresh(data)
        return data 