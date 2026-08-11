from sqlalchemy.orm import Session

from app.core.exceptions import DuplicateResourceError, ResourceNotFoundError
from app.core.security import hash_password
from app.models.profile import Profile
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate, Forgot

# Which fields of UserUpdate belong to the Profile table (one-to-one).
# The service uses this list to decide what to copy onto user.profile.
PROFILE_FIELDS = ("full_name", "phone", "bio", "location", "age", "date_of_birth")


def get_profile(current_user: User) -> User:
    # The current user is already loaded by the auth dependency, so
    # there is nothing else to do.
    return current_user


def update_profile(db: Session, current_user: User, data: UserUpdate) -> User:
    """
    Update account AND profile fields in one request.

    Flattened fields are split: username/email go on the User,
    the other fields go on the (one-to-one) Profile.
    """
    repo = UserRepository(db)

    # ---- User fields (users table) ----
    if data.username:
        # Changing to a username that already belongs to someone else?
        existing = repo.get_by_username(data.username)
        if existing and existing.id != current_user.id:
            raise DuplicateResourceError("Username already exists")
        current_user.username = data.username

    if data.email:
        existing = repo.get_by_email(data.email)
        if existing and existing.id != current_user.id:
            raise DuplicateResourceError("Email already exists")
        current_user.email = data.email

    # ---- Profile fields (profiles table) ----
    # Only touch the profile if at least one profile field was sent.
    if any(getattr(data, field) is not None for field in PROFILE_FIELDS):
        # Existing users (created before the Profile feature) may have no
        # profile yet - create one on the fly, the one-to-one relationship
        # fills in user_id automatically.
        if current_user.profile is None:
            current_user.profile = Profile(user_id=current_user.id)

        # Copy each provided field onto the profile object.
        for field in PROFILE_FIELDS:
            value = getattr(data, field)
            if value is not None:
                setattr(current_user.profile, field, value)

    # Commit everything in one transaction.
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user


def get_all_users(db: Session) -> list[User]:
    return UserRepository(db).get_all()


def get_user_with_details(db: Session, user_id: int) -> User:
    """
    Admin helper that returns ONE user with their profile (one-to-one)
    and their products (one-to-many) eager-loaded via selectinload.
    """
    repo = UserRepository(db)

    user = repo.get_with_details(user_id)
    if user is None:
        raise ResourceNotFoundError("User not found")

    return user


def delete_user(db: Session, user_id: int) -> None:
    # Remove a user; their Profile and Products are removed too via the
    # cascade rules on the User relationships.
    repo = UserRepository(db)

    user = repo.get_by_id(user_id)
    if user is None:
        raise ResourceNotFoundError("User not found")

    repo.delete(user)

def forgot_password(db: Session, data: Forgot) -> User:
    """
    Reset a user's password. Validates that the username exists, then
    hashes and stores the new password in one transaction.
    """
    repo = UserRepository(db)

    # The username is validated by the Forgot schema; here we only need
    # to make sure the account actually exists.
    user = repo.get_by_username(data.username)
    if user is None:
        raise ResourceNotFoundError("User not found")

    # Never store the plain-text password - hash it first.
    user.password = hash_password(data.password)

    return repo.create(user)