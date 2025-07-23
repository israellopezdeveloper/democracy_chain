import asyncio
import base64
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import aio_pika
from aio_pika.abc import AbstractChannel, AbstractRobustConnection
from database import get_async_session, init_db
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from models import UploadedFile
from sqlalchemy import func
from sqlmodel import select
from starlette.status import HTTP_200_OK, HTTP_404_NOT_FOUND, HTTP_409_CONFLICT

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
QUEUE_NAME = "documents"
UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

connection: AbstractRobustConnection | None = None
channel: AbstractChannel | None = None


async def connect_to_rabbitmq(retries=10, delay=3):
    global connection, channel
    for attempt in range(retries):
        try:
            connection = await aio_pika.connect_robust(
                "amqp://guest:guest@rabbitmq/",
                heartbeat=30,
            )
            channel = await connection.channel()
            await channel.declare_queue(QUEUE_NAME, durable=True)
            print("✅ Conectado a RabbitMQ")
            return
        except aio_pika.exceptions.AMQPConnectionError:
            print(f"❌ RabbitMQ not available ({attempt + 1}/{retries})")
            await asyncio.sleep(delay)
    raise RuntimeError("❌ Unable to connect to RabbitMQ")


@asynccontextmanager
async def lifespan(_: FastAPI):
    global channel
    await connect_to_rabbitmq()
    await init_db()
    yield  # Aquí se ejecuta la app
    if channel:
        await channel.close()
    if connection:
        await connection.close()
    print("🛑 RabbitMQ connection closed")


app.router.lifespan_context = lifespan


# PROGRAM
#   Create
@app.post("/{wallet_address}/program", response_class=PlainTextResponse)
async def program(
    wallet_address: str,
    file: UploadFile = File(...),  # noqa: B008
    overwrite: bool = Form(False),
):
    filename = "main"
    user_dir = os.path.join(UPLOAD_DIR, wallet_address)
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, filename)

    main_exists = os.path.exists(file_path)
    if main_exists and not overwrite:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail="A program file already exists for this wallet.",
        )

    # Guardar el archivo
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    if not main_exists:
        # Crear entrada en la base de datos
        new_record = UploadedFile(
            filename=filename,
            wallet_address=wallet_address,
            created_at=datetime.now(UTC),
        )

        async with get_async_session() as session:
            session.add(new_record)
            await session.commit()

    return PlainTextResponse(
        content=filename,
        status_code=status.HTTP_201_CREATED,
    )


#   Read
@app.get("/{wallet_address}/program", response_class=Response)
async def read_program(wallet_address: str):
    file_path = os.path.join(UPLOAD_DIR, wallet_address, "main")
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND, detail="Main program not found"
        )

    with open(file_path, "rb") as f:
        content = f.read()

    return Response(content=content, media_type="application/octet-stream")


#  Delete
@app.delete("/{wallet_address}/program", response_class=JSONResponse)
async def delete_program(wallet_address: str) -> JSONResponse:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
            UploadedFile.filename == "main",
        )
        result = await session.exec(stmt)
        file = result.first()

        if not file:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="Program 'main' not found for this wallet",
            )

        try:
            os.remove(os.path.join(UPLOAD_DIR, wallet_address, "main"))
        except FileNotFoundError:
            pass  # No pasa nada si ya no existe físicamente

        await session.delete(file)
        await session.commit()

        # Intentar eliminar la carpeta si está vacía
        try:
            os.rmdir(os.path.join(UPLOAD_DIR, wallet_address))
        except OSError:
            pass  # La carpeta no está vacía o no existe

        return JSONResponse(
            status_code=HTTP_200_OK,
            content={"message": f"'main' deleted for wallet {wallet_address}"},
        )


# FILE
#   Create
@app.post("/{wallet_address}/file", response_class=PlainTextResponse)
async def upload_file(
    wallet_address: str,
    file: UploadFile = File(...),  # noqa: B008
) -> PlainTextResponse:
    file_id = str(uuid.uuid4())
    filename: str = file_id + ("_" + file.filename if file.filename else "")

    user_dir = os.path.join(UPLOAD_DIR, wallet_address)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_record = UploadedFile(
        filename=filename,
        wallet_address=wallet_address,
        created_at=datetime.now(UTC),
    )

    async with get_async_session() as session:
        session.add(new_record)
        await session.commit()

    return PlainTextResponse(
        content=filename,
        status_code=status.HTTP_201_CREATED,
    )


#   Read
@app.get("/{wallet_address}/file", response_class=JSONResponse)
async def get_files(
    wallet_address: str,
) -> JSONResponse:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
        )
        results = await session.exec(stmt)
        files = results.all()
        return JSONResponse(
            status_code=HTTP_200_OK,
            content=[
                {
                    "filename": file.filename,
                    "wallet_address": file.wallet_address,
                    "created_at": file.created_at.isoformat(),
                }
                for file in files
                if file.filename != "main"
            ],
        )


@app.get("/{wallet_address}/file/{fileid}", response_class=JSONResponse)
async def get_file(
    wallet_address: str,
    fileid: str,
) -> JSONResponse:
    async with get_async_session() as session:
        if fileid == "main":
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="File not found",
            )

        file = await session.get(UploadedFile, (fileid, wallet_address))
        if not file:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="File not found",
            )
        return JSONResponse(
            status_code=HTTP_200_OK,
            content={
                "filename": file.filename,
                "wallet_address": file.wallet_address,
                "created_at": file.created_at.isoformat(),
            },
        )


@app.get(
    "/{wallet_address}/file/{filename}/download",
    response_class=FileResponse,
)
async def download_file(
    wallet_address: str,
    filename: str,
):
    if filename == "main":
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    file_path = os.path.join(UPLOAD_DIR, wallet_address, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@app.get(
    "/{wallet_address}/file/{filename}/base64",
    response_class=PlainTextResponse,
)
async def get_file_base64(wallet_address: str, filename: str):
    file_path = os.path.join(UPLOAD_DIR, wallet_address, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    try:
        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")

        # Detect MIME type from extension (basic)
        mime = "image/png"
        if filename.endswith(".jpg") or filename.endswith(".jpeg"):
            mime = "image/jpeg"
        elif filename.endswith(".gif"):
            mime = "image/gif"
        elif filename.endswith(".webp"):
            mime = "image/webp"

        data_url = f"data:{mime};base64,{encoded}"
        return PlainTextResponse(content=data_url)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}",
        ) from e


#   Remove
@app.delete("/{wallet_address}/file", response_class=JSONResponse)
async def delete_files(
    wallet_address: str,
) -> JSONResponse:
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
        )

        result = await session.exec(stmt)
        files = result.all()

        if not files:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No files found to delete",
            )

        for file in files:
            if file.filename == "main":
                continue
            try:
                os.remove(
                    os.path.join(
                        UPLOAD_DIR,
                        wallet_address,
                        file.filename,
                    )
                )
            except FileNotFoundError:
                pass
            await session.delete(file)

        await session.commit()

        # Intentar eliminar la carpeta si está vacía
        try:
            os.rmdir(os.path.join(UPLOAD_DIR, wallet_address))
        except OSError:
            pass  # La carpeta no está vacía o no existe

        return JSONResponse(
            status_code=HTTP_200_OK,
            content={
                "deleted_count": len(files),
                "deleted_filenames": [f.filename for f in files],
            },
        )


@app.delete("/{wallet_address}/file/{fileid}", response_class=JSONResponse)
async def delete_file(
    wallet_address: str,
    fileid: str,
) -> JSONResponse:
    if fileid == "main":
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    async with get_async_session() as session:
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
        )
        if fileid:
            stmt = stmt.where(UploadedFile.filename == fileid)

        result = await session.exec(stmt)
        files = result.all()

        if not files:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail="No files found to delete",
            )

        for file in files:
            try:
                os.remove(
                    os.path.join(
                        UPLOAD_DIR,
                        wallet_address,
                        file.filename,
                    )
                )
            except FileNotFoundError:
                pass
            await session.delete(file)

        await session.commit()

        # Intentar eliminar la carpeta si está vacía
        try:
            os.rmdir(os.path.join(UPLOAD_DIR, wallet_address))
        except OSError:
            pass  # La carpeta no está vacía o no existe

        return JSONResponse(
            status_code=HTTP_200_OK,
            content={
                "deleted_count": len(files),
                "deleted_filenames": [f.filename for f in files],
            },
        )


# WALLET
#   Read
@app.get("/wallets", response_class=JSONResponse)
async def list_wallets() -> JSONResponse:
    async with get_async_session() as session:
        stmt = select(
            UploadedFile.wallet_address, func.count().label("file_count")
        ).group_by(UploadedFile.wallet_address)
        result = await session.exec(stmt)
        wallets = [
            {
                "wallet_address": row[0],
                "file_count": row[1],
            }
            for row in result.all()
        ]
        return JSONResponse(content=wallets)


#   Delete
@app.delete("/{wallet_address}", response_class=JSONResponse)
async def delete_wallet(wallet_address: str) -> JSONResponse:
    async with get_async_session() as session:
        # Buscar archivos asociados
        stmt = select(UploadedFile).where(
            UploadedFile.wallet_address == wallet_address,
        )
        result = await session.exec(stmt)
        files = result.all()

        if not files:
            raise HTTPException(
                status_code=HTTP_404_NOT_FOUND,
                detail=f"Not found {wallet_address}",
            )

        # Eliminar archivos físicos y registros
        deleted_files = []
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, wallet_address, file.filename)
            try:
                os.remove(file_path)
                deleted_files.append(file.filename)
            except FileNotFoundError:
                pass
            await session.delete(file)

        await session.commit()

        # Eliminar la carpeta si está vacía
        try:
            os.rmdir(os.path.join(UPLOAD_DIR, wallet_address))
        except OSError:
            pass

        return JSONResponse(
            status_code=HTTP_200_OK,
            content={
                "message": f"Cartera '{wallet_address}' eliminada",
                "deleted_files": deleted_files,
            },
        )
