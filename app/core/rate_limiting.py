from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.models.user import User

# Maximum requests allowed per user per window
MAX_REQUESTS = 5

# Time window
WINDOW = timedelta(minutes=1)

# Store rate-limit information keyed by username
user_requests = {}


def check_rate_limit(
    current_user: User = Depends(get_current_user),
):
    """
    Dependency that limits each user (keyed by username) to MAX_REQUESTS
    calls per rolling WINDOW. Raises 429 once the limit is exceeded.
    """
    username = current_user.username

    now = datetime.now()

    # If we don't have this user yet, create their record.
    if username not in user_requests:
        user_requests[username] = {
            "count": 0,
            "window_start": now,
        }

    user_data = user_requests[username]

    # Check whether the time window has passed.
    if now - user_data["window_start"] >= WINDOW:
        # Start a new window.
        user_data["count"] = 0
        user_data["window_start"] = now

    # Check request limit.
    if user_data["count"] >= MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again later.",
        )

    # Count this request.
    user_data["count"] += 1