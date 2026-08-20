# ============================================================
# Redis client setup.
#
# Central place for the shared async Redis connection. Every
# module that needs Redis (e.g. the rate limiter in
# app/core/rate_limiting.py, the /redis test endpoint) imports
# the same `redis_client` instance so the whole app uses exactly
# one connection pool.
# ============================================================

from redis.asyncio import Redis

# Connection URL for the local Redis server. Change this to point
# at a hosted Redis (e.g. Redis Cloud) in production.
REDIS_URL = "redis://localhost:6379"

# One shared async Redis client. `decode_responses=True` makes Redis
# return plain str objects instead of bytes, which is easier to work
# with when storing and reading simple keys / counters.
redis_client = Redis.from_url(
    REDIS_URL,
    decode_responses=True,
)