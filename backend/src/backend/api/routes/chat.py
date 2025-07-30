from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.llm import query_llm
from backend.services.qdrant import get_similar_chunks

router = APIRouter()

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    embedding: list[float]


class ChatResponse(BaseModel):
    reply: str
    matched_wallets: list[str] = []


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        grouped_chunks = get_similar_chunks(request.embedding)

        reply, matched_wallets = query_llm(request.message, grouped_chunks)

        return ChatResponse(
            reply=reply,
            matched_wallets=matched_wallets,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        ) from e
