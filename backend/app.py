import json
import os
import shutil
import time
import uuid

import pika
from fastapi import FastAPI, File, Form, UploadFile, status
from fastapi.responses import PlainTextResponse
from pika.exceptions import AMQPConnectionError

app = FastAPI()
QUEUE_NAME = "documents"

UPLOAD_DIR = "/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def connect_to_rabbitmq(retries=10, delay=3):
    for attempt in range(retries):
        try:
            connection = pika.BlockingConnection(
                pika.ConnectionParameters("rabbitmq"),
            )
            channel = connection.channel()
            channel.queue_declare(queue="files")
            print("✅ Conectado a RabbitMQ")
            return channel
        except AMQPConnectionError as _:
            print(f"❌ RabbitMQ not available ({attempt + 1}/{retries})")
            time.sleep(delay)
    raise RuntimeError("❌ Unable to connect to RabbitMQ")


channel = connect_to_rabbitmq()
channel.queue_declare(queue=QUEUE_NAME)


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

    channel.basic_publish(
        exchange="",
        routing_key=QUEUE_NAME,
        body=json.dumps(message),
    )
    return {
        "message": "Document received",
        "file": file.filename,
        "program_id": program_id,
    }


@app.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):  # noqa: B008
    file_id = str(uuid.uuid4())
    filename: str = file_id + ("_" + file.filename if file.filename else "")
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return PlainTextResponse(
        content=filename,
        status_code=status.HTTP_201_CREATED,
    )
