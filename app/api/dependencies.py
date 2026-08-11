from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import verify_access_token
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User

# This helper tells FastAPI WHERE to look for the token: the
# Authorization header. `tokenUrl="/auth/login"` is metadata used by the
# auto-generated Swagger docs for the "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    # FastAPI first calls oauth2_scheme which extracts the raw token
    # string from the request, then runs get_db to open a session.
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the Bearer token back to a User object.

    This is a FastAPI DEPENDENCY: any endpoint that declares
    `user: User = Depends(get_current_user)` runs this first and
    receives the authenticated user.
    """
    # Decode + verify the JWT signature. Returns the payload dict
    # (e.g. {"sub": "alice", "role": "USER", "exp": ...}) or None.
    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or Expired Token",
        )

    # "sub" (subject) is the standard JWT claim we stored the username in.
    username = payload.get("sub")

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token",
        )

    # Load the full user row from the database by username.
    user = db.query(User).filter(User.username == username).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


def require_role(*roles: Role):
    """
    FACTORY that returns a role-checking dependency.

    Usage: `Depends(require_role(Role.ADMIN))`
    It first resolves the current user, then rejects the request with a
    403 unless the user's role is in the allowed list.
    """
    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission Denied",
            )
        return current_user

    return role_checker
