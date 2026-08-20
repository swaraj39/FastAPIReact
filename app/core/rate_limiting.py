# ============================================================
# Rate limiting (Redis-backed).
#
# Limits each user (keyed by username) to MAX_REQUESTS calls per
# rolling WINDOW_SECONDS window. Unlike the old in-memory version,
# the counters now live in Redis, so the limit is shared across
# workers / restarts and stays correct when the app is scaled to
# multiple processes.
# ============================================================

from fastapi import Depends, HTTPException, status

from app.api.dependencies import get_current_user
from app.core.redis import redis_client
from app.models.user import User

# Maximum requests allowed per user per window
MAX_REQUESTS = 5

# Length of the time window in seconds
WINDOW_SECONDS = 60


async def check_rate_limit(
    current_user: User = Depends(get_current_user),
):
    """
    Dependency that throttles each user to MAX_REQUESTS calls per
    WINDOW_SECONDS window. Raises 429 once the limit is exceeded.

    It relies on Redis INCR being atomic: every request increments the
    same key, so concurrent requests cannot race past the limit.
    """
    username = current_user.username

    # One Redis key per user, e.g. "rate_limit:alice".
    key = f"rate_limit:{username}"

    # Atomically increment the counter (created at 1 on first call).
    count = await redis_client.incr(key)

    # First request in the window: make the key auto-expire after the
    # window, so an idle user's counter doesn't grow forever in Redis.
    if count == 1:
        await redis_client.expire(key, WINDOW_SECONDS)

    # Over the limit: reject with 429 before the handler runs.
    if count > MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again later.",
        )