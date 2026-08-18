from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importing the model modules is REQUIRED even though we don't use them
# directly: it registers every table with SQLAlchemy's Base.metadata so
# that `Base.metadata.create_all` below knows to create all of them.
# Each model is one table: users (one-to-many + one-to-one parent),
# profiles (one-to-one child), products (one-to-many child).
import app.models.associations  # noqa: F401
import app.models.cart  # noqa: F401
import app.models.orders  # noqa: F401
import app.models.product  # noqa: F401
import app.models.profile  # noqa: F401
import app.models.user  # noqa: F401
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger
from app.db.base import Base
from app.db.database import engine
from app.middleware.request_logging import RequestLoggingMiddleware

logger.info("Application Started")

# Create any missing tables (users, profiles, products) on startup.
# Great for development; in production you would use Alembic migrations.
Base.metadata.create_all(bind=engine)

# Instantiate the FastAPI application.
app = FastAPI(
    title=settings.APP_NAME,
)

# Middleware runs on EVERY request (logging here). Order matters: the
# last added runs first.
app.add_middleware(RequestLoggingMiddleware)

# CORS must be the OUTERMOST middleware so it can answer browser
# preflight (OPTIONS) requests before anything else runs, and so every
# response gets the Access-Control-* headers. Added last = runs first.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers so our AppException subclasses
# (409, 401, 404, 403) return clean JSON error bodies.
register_exception_handlers(app)

# Mount all v1 routes (/auth, /user, /admin, /products).
app.include_router(api_router)


@app.get("/")
def home():
    return {
        "message": "FastAPI JWT Authentication",
    }
