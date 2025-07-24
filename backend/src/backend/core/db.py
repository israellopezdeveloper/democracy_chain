from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlmodel import SQLModel

from backend.core.config import settings

engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        print("==================================================================")
        print("==================================================================")
        print("==================================================================")
        print("==================================================================")
        print("==================================================================")
        print("==================================================================")
        print("==================================================================")
