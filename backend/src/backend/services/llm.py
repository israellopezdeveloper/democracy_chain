import json
import os
import re

import httpx

from backend.core.config import settings

LLM_URL = os.getenv("LLM_URL", "http://llm:11434/api/chat")
LLM_MODEL = os.getenv("LLM_MODEL", "llama2")

# Limita el número de fragmentos por programa para no saturar el LLM
MAX_CHUNKS_PER_WALLET = 3


def format_prompt(
    user_query: str,
    chunks_by_wallet: dict[str, list[str]],
) -> str:
    # prompt = f'Un ciudadano dijo: "{user_query}"\n\n'
    prompt = "Aquí tienes extractos de programas electorales agrupados por "
    "wallet:\n"

    for wallet, texts in chunks_by_wallet.items():
        prompt += f"\nPrograma de {wallet}:\n"
        for text in texts[:MAX_CHUNKS_PER_WALLET]:
            prompt += f"- {text.strip()}\n"

    prompt += (
        "\nResponde de forma clara qué programas se ajustan mejor al criterio " "del ciudadano. "
    )
    return prompt


def extract_wallets_from_response(text: str) -> tuple[str, list[str]]:
    match = re.search(r"WALLETS\s*=\s*(\[.*?\])", text)
    wallets = []
    cleaned_text = text

    if match:
        try:
            wallets = json.loads(match.group(1))
            # Elimina la línea completa donde aparece la expresión WALLETS=[...]
            cleaned_text = re.sub(r"WALLETS\s*=\s*\[.*?\]", "", text).strip()
        except Exception:
            pass

    return cleaned_text.strip(), wallets


def query_llm(user_query: str, chunks_by_wallet: dict[str, list[str]]) -> tuple[str, list[str]]:
    prompt = format_prompt(user_query, chunks_by_wallet)

    json = settings.LLM_SETTINGS
    json["messages"].append(
        {
            "role": "user",
            "content": prompt,
        }
    )

    response: httpx.Response = httpx.post(
        LLM_URL,
        json=json,
        timeout=120.0,
    )
    response.raise_for_status()

    result_text = response.json()["message"]["content"]
    result_text, matched_wallets = extract_wallets_from_response(result_text)

    return result_text, matched_wallets
