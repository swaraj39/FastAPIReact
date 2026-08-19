from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateResourceError, InvalidCredentialsError
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.profile import Profile
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import Token
from app.schemas.user import UserCreate


def register_user(db: Session, data: UserCreate) -> User:
    """
    Business logic for creating an account.

    The request body contains User fields AND Profile fields mixed
    together. This function SPLITS them: User columns go on the User
    object, Profile columns go on a new Profile object, and the
    relationship links them so they are saved in one transaction.
    """
    repo = UserRepository(db)

    # Guard against duplicate usernames before creating anything.
    if repo.get_by_username(data.username):
        raise DuplicateResourceError("Username already exists")

    # Guard against duplicate emails too.
    if repo.get_by_email(data.email):
        raise DuplicateResourceError("Email already exists")

    # Build the USER part of the payload. The password is hashed - the
    # plain text is never stored or logged.
    user = User(
        username=data.username,
        email=data.email,
        password=hash_password(data.password),
    )

    # Build the PROFILE part and attach it to the user.
    # Assigning `user.profile = Profile(...)` uses the one-to-one
    # relationship we defined: SQLAlchemy will fill in Profile.user_id
    # from user.id automatically on insert.
    user.profile = Profile(
        full_name=data.profile.full_name,
        phone=data.profile.phone,
        bio=data.profile.bio,
        location=data.profile.location,
        age=data.profile.age,
        date_of_birth=data.profile.date_of_birth,
    )

    # One commit inserts BOTH the user and the profile (one-to-one).
    return repo.create(user)


def authenticate_user(db: Session, username: str, password: str) -> Token:
    """
    Verify credentials and hand back a signed JWT.

    On success a new access token is created whose payload contains the
    username (`sub`) and role, both encoded into the token itself.
    """
    repo = UserRepository(db)

    # Fetch the user by username, then compare the stored hash against
    # the supplied password. Both checks failing lead to the same error
    # (so we don't reveal whether the username existed).
    user = repo.get_by_username(username)

    if not user or not verify_password(password, user.password):
        raise InvalidCredentialsError()

    # Create a signed JWT. The frontend sends it back as
    # `Authorization: Bearer <token>` on every protected request.
    access_token = create_access_token(
        {
            "sub": user.username,
            "role": user.role.value,
        }
    )
    refresh_token = create_refresh_token(
        {
            "sub": user.username,
            "role": user.role.value,
        }
    )

    return Token(access_token=access_token, 
                refresh_token=refresh_token, 
                token_type="bearer")
