# ============================================================
# Backend production image (multi-stage build).
#
# Stage 1 "builder" : downloads/installs pip dependencies.
# Stage 2 "runtime" : copies ONLY the installed packages + source code,
#                     runs as a non-root user, starts via entrypoint
#                     (migrations first, then gunicorn workers).
# Result: small image, no build tools, no secrets, no root.
# ============================================================

# ---------- Stage 1: dependency builder ----------
FROM python:3.12-slim AS builder

WORKDIR /build

# Copy only the manifest first so Docker caches this layer; it re-runs
# only when requirements.txt changes, not on every code edit.
COPY requirements.txt .

# --prefix=/install collects everything under /install so stage 2 can
# copy it in one layer without pip caches or build leftovers.
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ---------- Stage 2: runtime ----------
FROM python:3.12-slim

# Don't write .pyc files; stream print/log output straight to stdout
# (docker logs must see them in real time).
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Installed packages land in /usr/local (already on Python's sys.path).
COPY --from=builder /install /usr/local

# Application code only - no venv, no .env, no tests artifacts
# (.dockerignore keeps the heavy/secret stuff out of the context).
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY docker-entrypoint.sh .

# Non-root user owns /app (uploads + logs must be writable).
# The sed strips any Windows CRLF line-endings from the script.
RUN addgroup --system app \
 && adduser --system --ingroup app app \
 && mkdir -p /app/uploads /app/logs \
 && chown -R app:app /app \
 && sed -i 's/\r$//' docker-entrypoint.sh \
 && chmod +x docker-entrypoint.sh

USER app

EXPOSE 8000

# Entrypoint = migrations then gunicorn (see docker-entrypoint.sh).
ENTRYPOINT ["./docker-entrypoint.sh"]
