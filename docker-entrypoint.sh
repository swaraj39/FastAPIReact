#!/bin/sh
# ============================================================
# Container entrypoint = the "release step".
# 1. Apply pending database migrations (idempotent: no-op when
#    the schema is already up to date).
# 2. Replace the shell with gunicorn (exec -> PID 1 receives
#    SIGTERM properly, so `docker stop` shuts down gracefully).
# ============================================================
set -e

echo "[entrypoint] Applying database migrations..."
alembic upgrade head
echo "[entrypoint] Migrations up to date."

echo "[entrypoint] Starting gunicorn with uvicorn workers..."
exec gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -w 2 \
    --bind 0.0.0.0:8000 \
    --access-logfile - \
    --error-logfile - \
    --forwarded-allow-ips="*"
