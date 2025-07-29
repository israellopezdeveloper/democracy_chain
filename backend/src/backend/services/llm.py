import json
import os
import re

import httpx

from backend.core.config import settings

LLM_URL = os.getenv("LLM_URL", "http://llm:11434/api/generate")
LLM_MODEL = os.getenv("LLM_MODEL", "llama2")

# Limita el número de fragmentos por programa para no saturar el LLM
MAX_CHUNKS_PER_WALLET = 3


def format_prompt(
    user_query: str,
    chunks_by_wallet: dict[str, list[str]],
) -> str:
    prompt = f'Un ciudadano dijo: "{user_query}"\n\n'
    prompt += "Aquí tienes extractos de programas electorales agrupados por "
    "wallet:\n"

    for wallet, texts in chunks_by_wallet.items():
        prompt += f"\nPrograma de {wallet}:\n"
        for text in texts[:MAX_CHUNKS_PER_WALLET]:
            prompt += f"- {text.strip()}\n"

    prompt += (
        "\nResponde de forma clara qué programas se ajustan mejor al criterio "
        "del ciudadano. "
        "Si hay alguno que destaca, termina tu respuesta con:\n"
        'WALLETS=["0x..."]'
    )
    return prompt


def extract_wallets_from_response(text: str) -> list[str]:
    match = re.search(r"WALLETS\s*=\s*(\[.*?\])", text)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            return []
    return []


def query_llm(
    user_query: str, chunks_by_wallet: dict[str, list[str]]
) -> tuple[str, list[str]]:
    prompt = format_prompt(user_query, chunks_by_wallet)

    response = httpx.post(
        LLM_URL,
        json={
            **settings.LLM_SETTINGS,
            "prompt": prompt,
        },
    )
    response.raise_for_status()

    result_text = response.json()["response"]
    matched_wallets = extract_wallets_from_response(result_text)

    return result_text, matched_wallets
