



from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.services import order_service


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)

@router.post(
    ""
)
def add_order(request: OrderCreate,
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user),):
    return order_service.create_order(request, db, current_user)


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return every order placed by the logged-in user.
    """
    return order_service.list_orders(db, current_user)