from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_refresh_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import RefreshTokenRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.services import auth_service

# APIRouter groups related endpoints together. Everything defined with
# this router gets the "/auth" prefix, e.g. /auth/register.
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: UserCreate,  # FastAPI parses + validates the JSON body into this
    db: Session = Depends(get_db),  # dependency-injected DB session
):
    """
    Create a user + their profile (one-to-one).

    The single request body holds User fields AND Profile fields; the
    service splits them across the two tables.
    """
    return auth_service.register_user(db, request)


@router.post("/login", response_model=Token)
def login(
    # OAuth2PasswordRequestForm reads username/password from FORM data
    # (not JSON). FastAPI's security helpers expect this exact shape.
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    Exchange username + password for a JWT access token.
    """
    return auth_service.authenticate_user(
        db,
        form_data.username,
        form_data.password,
    )


@router.post("/refresh")
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    payload = verify_refresh_token(request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    username = payload.get("sub")

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = (
        db.query(User)
        .filter(User.username == username)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    new_access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role.value,
        }
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }