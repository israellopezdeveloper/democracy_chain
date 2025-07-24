from fastapi import APIRouter

from backend.api.routes import files, program, wallet

api_router = APIRouter()
api_router.include_router(files.router)
api_router.include_router(wallet.router)
api_router.include_router(program.router)
