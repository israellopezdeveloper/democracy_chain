from __future__ import annotations

from typing import Any

from qdrant_client import QdrantClient

client = QdrantClient(host="qdrant", port=6333)


def get_similar_chunks(embedding: list[float], top_k: int = 5) -> dict[str, list[str]]:
    hits: list[Any] = client.search(
        collection_name="program_chunks",
        query_vector=embedding,
        limit=top_k,
    )
    grouped: dict[str, list[str]] = {}
    for hit in hits:
        wallet = hit.payload["wallet_address"]
        grouped.setdefault(wallet, []).append(hit.payload["text"])
    return grouped
