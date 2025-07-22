import hashlib
import json

import pika
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer
from unstructured.partition.auto import partition

queue = "documents"
client = QdrantClient(host="qdrant", port=6333)
collection = "programas"

model = SentenceTransformer("BAAI/bge-small-en-v1.5")


def ensure_collection():
    if collection not in [c.name for c in client.get_collections().collections]:
        client.recreate_collection(
            collection_name=collection,
            vectors_config=VectorParams(size=384, distance=Distance.COSINE),
        )


def process_file(filepath, filename, program_id):
    elements = partition(filename=filepath)
    for idx, elem in enumerate(elements):
        text = elem.text.strip()
        if not text:
            continue
        vector = model.encode(text).tolist()
        id = int(
            hashlib.sha1(f"{filename}-{idx}".encode()).hexdigest(),
            16,
        ) % (10**16)
        client.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=id,
                    vector=vector,
                    payload={
                        "program_id": program_id,
                        "filename": filename,
                        "chunk": text,
                    },
                )
            ],
        )
        print(f"Indexed chunk {idx} from {filename} (program: {program_id})")


def callback(ch, method, _, body):
    msg = json.loads(body)
    print("Processing:", msg)
    process_file(msg["filepath"], msg["filename"], msg["program_id"])
    ch.basic_ack(delivery_tag=method.delivery_tag)


ensure_collection()
connection = pika.BlockingConnection(pika.ConnectionParameters("rabbitmq"))
channel = connection.channel()
channel.queue_declare(queue=queue)
channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=queue, on_message_callback=callback)
print(" [*] Waiting for messages. To exit press CTRL+C")
channel.start_consuming()
