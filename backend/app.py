import asyncio
import json
import os
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import aio_pika
from aio_pika.abc import AbstractChannel, AbstractRobustConnection
from database import get_async_session, init_db
from fastapi import FastAPI, File, Form, UploadFile, status
from fastapi.responses import PlainTextResponse
from models import UploadedFile

app = FastAPI()
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


@app.post("/upload_program/")
async def upload_document(
    file: UploadFile = File(...),  # noqa: B008
    program_id: str = Form(...),
):
    path = f"/data/{file.filename}"
    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    message = {
        "filepath": path,
        "filename": file.filename,
        "program_id": program_id,
    }

    assert channel is not None
    await channel.default_exchange.publish(
        aio_pika.Message(body=json.dumps(message).encode()),
        routing_key=QUEUE_NAME,
    )

    return {
        "message": "Document received",
        "file": file.filename,
        "program_id": program_id,
    }


@app.post("/upload_file")
async def upload_file(
    file: UploadFile = File(...),  # noqa: B008
    wallet_address: str = Form(...),
):
    file_id = str(uuid.uuid4())
    filename: str = file_id + ("_" + file.filename if file.filename else "")

    user_dir = os.path.join(UPLOAD_DIR, wallet_address)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    new_record = UploadedFile(
        filename=filename,
        filepath=file_path,
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
