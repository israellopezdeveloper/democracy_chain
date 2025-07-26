import json
import os
import uuid

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointIdsList,
    PointStruct,
    VectorParams,
)
from sentence_transformers import SentenceTransformer

from worker.core.config import EMBEDDING_MODEL, QDRANT_URL, UPLOAD_DIR
from worker.services.chunk_text import chunk_text
from worker.services.extract_text import extract_text

model = SentenceTransformer(EMBEDDING_MODEL)
qdrant = QdrantClient(url=QDRANT_URL)


async def process_file(payload: str):
    data = json.loads(payload)
    file = data["file"]

    wallet = file["wallet_address"]
    filename = file["filename"]
    mime_type = file["mime_type"]
    created_at = file.get("created_at")

    filepath = os.path.join(UPLOAD_DIR, wallet, filename)
    if not os.path.exists(filepath):
        print(f"[!] File not found: {filepath}")
        return

    try:
        text = extract_text(filepath, mime_type)
    except Exception as e:
        print(f"[!] Error extracting text from {filename}: {e}")
        return

    chunks = chunk_text(text)
    vectors = model.encode(chunks).tolist()

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
                "created_at": created_at,
            },
        )
        for i, (chunk, vector) in enumerate(zip(chunks, vectors, strict=False))
    ]

    qdrant.upload_points(collection_name=collection, points=points)
    print(f"[+] Ingested {len(points)} chunks from {filename}")


def delete_file_vectors(payload: str):
    print("delete_file_vectors 1", payload)
    data = json.loads(payload)
    print("delete_file_vectors 2", json)

    wallet = data["wallet_address"]
    filename = data["filename"]
    scroll_result, _ = qdrant.scroll(
        collection_name="program_chunks",
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="wallet_address",
                    match=MatchValue(value=wallet),
                ),
                FieldCondition(
                    key="filename",
                    match=MatchValue(value=filename),
                ),
            ]
        ),
        with_payload=False,
        with_vectors=False,
        limit=10000,
    )
    print("delete_file_vectors 3")

    point_ids = [point.id for point in scroll_result]
    if point_ids:
        qdrant.delete(
            collection_name="program_chunks",
            points_selector=PointIdsList(points=point_ids),
        )
        print(f"[🗑️] Deleted {len(point_ids)} points for {filename}")
    else:
        print(f"[ℹ️] No points found for {filename}")
