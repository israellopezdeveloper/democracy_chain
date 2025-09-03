FROM docker.io/ollama/ollama:latest

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

ARG LLM_MODEL=llama3
ENV LLM_MODEL=${LLM_MODEL}
ENV OLLAMA_MODELS=/root/.ollama

# Inicia el server temporalmente para poder hacer el pull durante el build
RUN set -eux; \
    (ollama serve & pid=$!; \
    echo "Esperando a Ollama..."; \
    until curl -sf http://127.0.0.1:11434/api/tags >/dev/null; do sleep 2; done; \
    echo "Descargando modelo ${LLM_MODEL}..."; \
    ollama pull "${LLM_MODEL}"; \
    kill $pid; \
    wait || true)

EXPOSE 11434
CMD ["ollama", "serve"]

