import json
import os
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

from worker.core.config import EMBEDDING_MODEL, QDRANT_URL, UPLOAD_DIR

model = SentenceTransformer(EMBEDDING_MODEL)
qdrant = QdrantClient(url=QDRANT_URL)


def chunk_text(text, chunk_size=300):
    words = text.split()
    return [
        " ".join(words[i : i + chunk_size])
        for i in range(
            0,
            len(words),
            chunk_size,
        )
    ]


async def process_file(payload: str):
    data = json.loads(payload)
    wallet = data["wallet_address"]
    filename = data["filename"]

    filepath = os.path.join(UPLOAD_DIR, wallet, filename)
    if not os.path.exists(filepath):
        print(f"[!] File not found: {filepath}")
        return

    with open(filepath, encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text)
    vectors = model.encode(chunks).tolist()

    # Crear colección si no existe
    collection = "program_chunks"
    if not qdrant.collection_exists(collection):
        qdrant.recreate_collection(
            collection_name=collection,
            vectors_config=VectorParams(
                size=len(vectors[0]),
                distance=Distance.COSINE,
            ),
        )

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "wallet_address": wallet,
                "filename": filename,
                "chunk_id": i,
                "text": chunk,
            },
        )
        for i, (chunk, vector) in enumerate(zip(chunks, vectors, strict=False))
    ]

    qdrant.upload_points(collection_name=collection, points=points)
    print(f"[+] Ingested {len(points)} chunks from {filename}")
