from qdrant_client import QdrantClient

from backend.services.embedding import embed_text

client = QdrantClient(host="qdrant", port=6333)


def get_similar_chunks(query: str, top_k: int = 10):
    query_vector = embed_text(query)
    hits: list = client.search(
        collection_name="programs", query_vector=query_vector, limit=top_k
    )
    grouped = {}
    for hit in hits:
        wallet = hit.payload["wallet"]
        grouped.setdefault(wallet, []).append(hit.payload["text"])
    return grouped
