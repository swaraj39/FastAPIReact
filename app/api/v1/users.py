from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, Forgot
from app.services import user_service

router = APIRouter(
    prefix="/user",
    tags=["User"],
)


@router.get("/profile", response_model=UserResponse)
def profile(
    # get_current_user reads the JWT from the Authorization header, checks
    # its signature, and loads the matching User from the database.
    # FastAPI runs this dependency BEFORE the function body, so if the
    # token is invalid we get a 401 without ever reaching here.
    current_user: User = Depends(get_current_user),
):
    """
    Return the currently logged-in user (including their one-to-one
    Profile via the nested `profile` field).
    """
    return user_service.get_profile(current_user)


@router.put("/update", response_model=UserResponse)
def update_profile(
    request: UserUpdate,  # flattened account + profile fields
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update account fields (users table) and profile fields (profiles
    table, one-to-one) in a single request.
    """
    return user_service.update_profile(db, current_user, request)


@router.get("/dashboard")
def dashboard(
    current_user: User = Depends(get_current_user),
):
    """
    Small demo endpoint showing that the role travels inside the token.
    """
    return {
        "message": f"Welcome {current_user.username}",
        "role": current_user.role,
    }


@router.post("/forgot")
def forgot(
    request: Forgot,
    db: Session = Depends(get_db),
):
    """
    Reset a password. Does not require authentication - the user only
    needs to know their username.
    """
    user = user_service.forgot_password(db, request)
    return {
        "message": "Password updated successfully",
        "username": user.username,
    }