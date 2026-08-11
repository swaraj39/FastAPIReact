from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import Token
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
