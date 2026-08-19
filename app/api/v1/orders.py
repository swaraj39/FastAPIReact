# ============================================================
# Order routes.
#
# Orders represent completed purchases. They can be created directly
# via POST /orders, or in bulk via POST /cart/checkout.
#
# GET /orders is rate-limited (5 requests/minute per user) to
# demonstrate the check_rate_limit dependency.
# ============================================================

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.rate_limiting import check_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse
from app.services import order_service

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


@router.post("")
def add_order(
    request: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Place a direct order for one product.

    This is the simple path — for the cart-based flow, see
    POST /cart/checkout which converts multiple cart lines into orders
    at once.
    """
    return order_service.create_order(request, db, current_user)


@router.get("", response_model=list[OrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(check_rate_limit),
):
    """
    Return every order placed by the logged-in user, newest first.

    Rate-limited to 5 requests per minute per user. Exceeding the
    limit returns a 429 Too Many Requests.
    """
    return order_service.list_orders(db, current_user)