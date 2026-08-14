from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.cart import CartCreate
from app.services import cart_service as cs

router = APIRouter(
    prefix="/cart",
    tags=["Carts"],
)

@router.post(
    ""
)
def addCart(data: CartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cs.addCart(data, db, current_user.id)