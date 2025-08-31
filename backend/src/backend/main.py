from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from backend.api.main import api_router
from backend.core.config import settings
from backend.core.db import init_db


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)


# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Añadir aqui rabbitmq
    await init_db()
    yield  # Aquí se ejecuta la app
    # if channel:
    #     await channel.close()
    # if connection:
    #     await connection.close()
    # print("🛑 RabbitMQ connection closed")


app.router.lifespan_context = lifespan
