from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# passlib context configured to use the bcrypt hashing algorithm.
# It handles both hashing (registration) and verification (login).
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Turn a plain-text password into a one-way bcrypt hash.
    The hash (never the original) is what gets stored in the database.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare a candidate password against a stored hash.
    Returns True only if they match.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_token(
    data: dict,
    expires_delta: timedelta,
    token_type: str,
) -> str:
    """
    Sign a JSON Web Token (JWT) containing the given claims.

    The token is signed with SECRET_KEY so nobody can forge one, and it
    carries an expiry so a stolen token stops working after some time.
    """
    to_encode = data.copy()

    # Compute the expiry timestamp: now + the given lifetime.
    expire = datetime.now(timezone.utc) + expires_delta

    # "exp" is the standard JWT claim for expiration, and "type"
    # marks what kind of token this is (access, refresh, ...).
    to_encode.update({
        "exp": expire,
        "type": token_type,
    })

    # Encode (sign) the payload into an opaque token string.
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(data: dict) -> str:
    """
    Create an access token using the configured lifetime.

    Delegates to create_token with the access-token expiry from settings.
    """
    return create_token(
        data=data,
        expires_delta=timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
        token_type="access",
    )

def create_refresh_token(data: dict) -> str:
    """
        Create an refresh token using the configured lifetime.
    
        Delegates to create_token with the refresh-token expiry from settings.
    """
    return create_token(
        data=data,
        expires_delta=timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        ),
        token_type="refresh",
    )

def verify_access_token(token: str):
    """
    Decode and verify a JWT's signature + expiry.

    Returns the payload dict on success, or None if the token is
    invalid, expired, or has been tampered with.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("type") != "access":
            return None

        return payload

    except JWTError:
        return None


def verify_refresh_token(token: str):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        if payload.get("type") != "refresh":
            return None

        return payload

    except JWTError:
        return None
