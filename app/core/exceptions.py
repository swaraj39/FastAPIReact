import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.logging import logger


class AppException(Exception):
    status_code = 500
    detail = "Internal Server Error"

    def __init__(self, detail: str | None = None):
        self.detail = detail or self.detail
        super().__init__(self.detail)


class DuplicateResourceError(AppException):
    status_code = 409
    detail = "Resource already exists"


class InvalidCredentialsError(AppException):
    status_code = 401
    detail = "Invalid username or password"


class ResourceNotFoundError(AppException):
    status_code = 404
    detail = "Resource not found"


class PermissionDeniedError(AppException):
    status_code = 403
    detail = "Permission denied"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled error: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
        )
