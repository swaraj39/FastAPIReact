# ============================================================
# Redis routes.
#
# A tiny demo endpoint used to prove the app can reach the Redis
# server: it writes a value, reads it straight back and returns it.
# Handy for verifying the connection before relying on Redis-backed
# features (like the rate limiter in app/core/rate_limiting.py).
# ============================================================

from fastapi import APIRouter
from app.core.redis import redis_client

router = APIRouter(
    prefix="/redis",
    tags=["Redis"],
)

@router.get("/test-redis")
async def test_redis():
    """
    Write a key to Redis and read it back in the same request.
    If Redis is unreachable this endpoint errors, which makes it a
    quick connectivity check for the shared `redis_client`.
    """
    await redis_client.set("test_key", "hello")

    value = await redis_client.get("test_key")

    return {
        "redis_value": value
    }