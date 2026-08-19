# ============================================================
# Authentication schemas.
#
# Token: returned by POST /auth/login. The frontend stores
#   access_token in localStorage and sends it as Bearer.
#
# TokenData: the decoded JWT payload (sub=username, role=role).
#   Used internally after verify_access_token(); not sent to clients.
#
# UserLogin: an alternative login schema (currently unused in favour
#   of OAuth2PasswordRequestForm, but kept as a reference).
# ============================================================

from typing import Optional

from pydantic import BaseModel


class UserLogin(BaseModel):
    """
    Alternative login body (JSON). Currently unused because FastAPI's
    OAuth2PasswordRequestForm expects form-data instead. Kept for
    reference.
    """

    username: str
    password: str


class Token(BaseModel):
    """
    JWT response returned by POST /auth/login.

    The frontend stores `access_token` and `refresh_token` in localStorage and attaches it
    to every protected request as `Authorization: Bearer <token>`.
    """

    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    """
    Decoded JWT payload (used internally, never sent to clients).

    Populated by verify_access_token() in app/core/security.py and
    consumed by get_current_user() in app/api/dependencies.py.
    """

    username: Optional[str] = None
    role: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str