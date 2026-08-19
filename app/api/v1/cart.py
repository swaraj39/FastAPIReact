# ============================================================
# Cart routes.
#
# The cart is the PENDING state: items are added here first, and only
# after "Approve & Checkout" are they converted into permanent order
# rows. This two-step flow lets users review before committing.
# ============================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemResponse, CartItemUpdate
from app.services import cart_service

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


@router.post("", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
def add_to_cart(
    request: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a product to the logged-in user's cart.

    If the product is already in the cart, the quantity is bumped
    instead of creating a duplicate line (idempotent behaviour).
    """
    return cart_service.add_to_cart(request, db, current_user)


@router.get("", response_model=list[CartItemResponse])
def list_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Every line in the logged-in user's cart (the PENDING items not yet
    turned into orders). Each item includes the nested product name
    and price for display.
    """
    return cart_service.list_cart(db, current_user)


@router.put("/{item_id}", response_model=CartItemResponse)
def update_quantity(
    item_id: int,
    request: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change the quantity of an existing cart line.

    Only the owner of the cart line may modify it; attempting to
    update another user's line returns a 404.
    """
    return cart_service.update_quantity(item_id, request.quantity, db, current_user)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a single line from the cart (no confirmation needed).
    """
    cart_service.remove_from_cart(item_id, db, current_user)


@router.post("/checkout")
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Approve the cart: convert every cart line into an order row and
    empty the cart.

    Returns how many orders were placed so the frontend can display
    a confirmation message.
    """
    orders = cart_service.checkout(db, current_user)
    return {
        "message": f"{len(orders)} order(s) placed",
        "orders": len(orders),
    }