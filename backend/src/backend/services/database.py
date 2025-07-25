from datetime import UTC, datetime

from fastapi import HTTPException
from sqlalchemy.sql.functions import count
from sqlmodel import select
from starlette.status import HTTP_404_NOT_FOUND

from backend.core.db import get_async_session
from backend.models.uploadedfile import UploadedFile


async def add(wallet_address: str, filename: str, mime_type: str) -> None:
    new_record = UploadedFile(
        filename=filename,
        wallet_address=wallet_address,
        created_at=datetime.now(UTC),
        mime_type=mime_type,
    )

    async with get_async_session() as session:
        session.add(new_record)
        await session.commit()


async def read_all(wallet_address: str) -> list[UploadedFile]:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
        )
        results = await session.execute(stmt)
        return [file for (file,) in results.all()]


async def read(wallet_address: str, fileid: str) -> UploadedFile:
    async with get_async_session() as session:
        file = await session.get(UploadedFile, (fileid, wallet_address))
        if not file:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="File not found",
            )
        return file


async def read_wallets() -> list[dict[str, str | int]]:
    async with get_async_session() as session:
        stmt = select(
            UploadedFile.wallet_address, count().label("file_count")
        ).group_by(UploadedFile.wallet_address)
        result = await session.execute(stmt)
        return [
            {
                "wallet_address": row[0],
                "file_count": row[1],
            }
            for row in result.all()
        ]


async def remove_all(wallet_address: str) -> list[UploadedFile]:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
            UploadedFile.filename != "main",
        )
        result = await session.execute(stmt)
        files = result.all()
        num_files: int = len(files)
        if num_files < 1:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No files found to delete",
            )
        for (file,) in files:
            await session.delete(file)
        await session.commit()
        return [file for (file,) in files]


async def remove(wallet_address: str, fileid: str) -> list[UploadedFile]:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
            UploadedFile.filename != "main",
        )
        if fileid:
            stmt = stmt.where(UploadedFile.filename == fileid)

        result = await session.execute(stmt)
        files = result.all()
        num_files: int = len(files)
        if num_files < 1:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No files found to delete",
            )
        for (file,) in files:
            await session.delete(file)
        await session.commit()
        return [file for (file,) in files]


async def remove_program(wallet_address: str) -> list[UploadedFile]:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
            UploadedFile.filename == "main",
        )

        result = await session.execute(stmt)
        files = result.all()
        num_files: int = len(files)
        if num_files < 1:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No files found to delete",
            )
        for (file,) in files:
            await session.delete(file)
        await session.commit()
        return [file for (file,) in files]


async def remove_wallet(wallet_address: str) -> dict[str, str | int]:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
            UploadedFile.filename != "main",
        )
        result = await session.execute(stmt)
        files = result.all()
        num_files: int = len(files)
        if num_files < 1:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Wallet not found",
            )
        for (file,) in files:
            await session.delete(file)
        await session.commit()
        return {
            "wallet_address": wallet_address,
            "file_count": num_files,
        }
