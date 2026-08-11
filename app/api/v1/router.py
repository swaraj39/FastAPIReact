from fastapi import APIRouter

from app.api.v1 import admin, auth, products, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
api_router.include_router(products.router)
