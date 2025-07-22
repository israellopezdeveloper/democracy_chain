import asyncio
import hashlib
import json

from aio_pika import connect_robust
from aio_pika.abc import AbstractIncomingMessage
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer
from unstructured.partition.auto import partition

QUEUE_NAME = "documents"
QDRANT_HOST = "qdrant"
QDRANT_PORT = 6333
COLLECTION = "programas"
MODEL = SentenceTransformer("BAAI/bge-small-en-v1.5")

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def ensure_collection():
    collections = client.get_collections().collections
    if COLLECTION not in [c.name for c in collections]:
        client.recreate_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def process_file(filepath: str, filename: str, program_id: str):
    elements = partition(filename=filepath)
    for idx, elem in enumerate(elements):
        text = elem.text.strip()
        if not text:
            continue

        vector = MODEL.encode(text).tolist()
        doc_id = int(
            hashlib.sha1(f"{filename}-{idx}".encode()).hexdigest(),
            16,
        ) % (10**16)

        client.upsert(
            collection_name=COLLECTION,
            points=[
                PointStruct(
                    id=doc_id,
                    vector=vector,
                    payload={
                        "program_id": program_id,
                        "filename": filename,
                        "chunk": text,
                    },
                )
            ],
        )
        print(f"✅ Indexed chunk {idx} from {filename} (program: {program_id})")


async def handle_message(message: AbstractIncomingMessage):
    async with message.process():  # automatic ack
        try:
            data = json.loads(message.body.decode())
            print("📦 Processing:", data)
            process_file(data["filepath"], data["filename"], data["program_id"])
        except Exception as e:
            print(f"❌ Error processing message: {e}")
            # Optional: requeue or reject based on your logic


async def main():
    ensure_collection()

    connection = await connect_robust("amqp://guest:guest@rabbitmq/")
    channel = await connection.channel()

    # Declare queue with durable=True to match backend
    queue = await channel.declare_queue(QUEUE_NAME, durable=True)
    await queue.consume(handle_message)

    print("🕓 Waiting for messages. To exit press CTRL+C")
    await asyncio.Future()  # Run forever


if __name__ == "__main__":
    asyncio.run(main())
