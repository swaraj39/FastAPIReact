import math

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import (
    PaginatedProducts,
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services import product_service

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    request: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # only logged-in users
):
    # The product is created as owned by `current_user`.
    return product_service.create_product(db, current_user, request)


@router.get("", response_model=PaginatedProducts)
def list_products(
    # Query parses optional URL parameters: ?owner_id=... skips to a page
    # with ?page=2 and limits rows per page with ?limit=5.
    owner_id: int | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=5, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List products, one page at a time. Each item's nested `owner` is
    eager-loaded with selectinload (see ProductRepository) so there are
    no N+1 queries.

    Returns a wrapper with `items`, `total`, `pages`, `page` and `limit`
    so the frontend can draw Prev/Next controls on top of the one page.
    """
    items, total = product_service.list_products(db, owner_id=owner_id, page=page, limit=limit)
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit),
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,  # path parameter -> /products/5
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return product_service.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    request: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Load the product, verify the caller may manage it (owner or admin),
    # then apply the changes.
    product = product_service.get_product(db, product_id)
    product_service.can_manage_product(product, current_user)
    return product_service.update_product(db, product, request)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.get_product(db, product_id)
    product_service.can_manage_product(product, current_user)
    product_service.delete_product(db, product)
    return {"message": "Product deleted"}
