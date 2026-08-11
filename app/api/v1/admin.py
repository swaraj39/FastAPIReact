from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserResponse, UserWithProductsResponse
from app.services import user_service

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


@router.get("/dashboard")
def admin_dashboard(
    # require_role(...) is a dependency FACTORY: it returns a dependency
    # that first loads the current user, then rejects non-ADMIN roles
    # with a 403. Only admins can reach this handler.
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    return {
        "message": f"Welcome Admin {current_user.username}",
    }


@router.get("/users", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    # List every user (each with its one-to-one Profile).
    return user_service.get_all_users(db)


@router.get("/users/{user_id}", response_model=UserWithProductsResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    """
    ONE-TO-MANY in action: return a single user together with the list
    of ALL their products.

    The repository uses:
        selectinload(User.profile)   -> one-to-one, eager
        selectinload(User.products)  -> one-to-many, eager
    so both collections come back pre-loaded (no N+1 queries).
    """
    return user_service.get_user_with_details(db, user_id)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    # Deleting the user also deletes their Profile and Products thanks
    # to the cascade rules on the User model relationships.
    user_service.delete_user(db, user_id)
    return {"message": "User deleted"}


@router.post("/create-admin")
def create_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(Role.ADMIN)),
):
    # Demo endpoint kept for reference - it simply proves only admins
    # can call it.
    return {
        "message": "Only Admin can access this endpoint.",
    }
