import logging
import os
from logging.handlers import RotatingFileHandler

from app.core.config import settings


# ------------------------------------------------------------------
# Logger setup.
#
# The logger writes to two destinations:
#   1. Console (StreamHandler) — visible in the terminal during dev.
#   2. File (RotatingFileHandler) — app.log in settings.LOG_DIR,
#      rotated at 5 MB with up to 5 backup files.
#
# Format: 2026-08-19 14:30:00 | INFO | fastapi_app | GET /products -> 200 (8.27 ms)
#
# Used by:
#   - middleware/request_logging.py  (every request: method, path, status, duration)
#   - core/exceptions.py             (unhandled errors)
#   - main.py                        (app startup)
# ------------------------------------------------------------------


def setup_logger() -> logging.Logger:
    """
    Build and return the application-wide logger.

    Safe to call multiple times: clears existing handlers first so
    Uvicorn's --reload doesn't duplicate log lines.
    """
    log_dir = settings.LOG_DIR

    # Ensure the log directory exists before opening the file.
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    log_file = os.path.join(log_dir, "app.log")

    # Use a named logger so other libraries' log messages don't
    # interfere with ours.
    _logger = logging.getLogger("fastapi_app")
    _logger.setLevel(logging.INFO)

    # Clear handlers from a previous call (e.g. Uvicorn reload).
    if _logger.hasHandlers():
        _logger.handlers.clear()

    # Timestamped, pipe-delimited format for easy grep and parsing.
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Handler 1: write to the terminal (stdout).
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # Handler 2: write to logs/app.log, rotating at 5 MB per file.
    # The `backupCount=5` keeps at most 5 old files (app.log.1 … .5).
    file_handler = RotatingFileHandler(
        filename=log_file,
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    _logger.addHandler(console_handler)
    _logger.addHandler(file_handler)

    return _logger


# Module-level singleton: import `from app.core.logging import logger`
# anywhere in the app to get the configured logger.
logger = setup_logger()
