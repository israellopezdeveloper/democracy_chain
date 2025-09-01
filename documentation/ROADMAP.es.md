# 📍 ROADMAP — Sistema RAG de Democracy Chain

## 🧠 Objetivo final del RAG

**Input:** Una preferencia del votante en lenguaje natural **Output:**
Los 10 programas que mejor se ajustan a dicha preferencia

## 🗺️ Roadmap detallado para implementar RAG

### 🔹 Etapa 1: Ingesta masiva de documentos

| Paso    | Descripción                                                                                                         | Herramientas                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **1.1** | Estandarizar el formato de ingreso (PDF, Word, txt, etc.)                                                           | `unstructured`, `pdfminer`, `docx`                                                           |
| **1.2** | Dividir porciones del texto (chunking inteligente con metadatos)                                                    | `langchain.text_splitter.RecursiveCharacterTextSplitter`, o `unstructured.chunking`          |
| **1.3** | Guardar documentos con metadatos (`candidato`, `partido`, `año`, etc.)                                              | Usa Qdrant con payloads estructurados (`source_id`, `title`, `page`, `party`, `filename`...) |
| **1.4** | Implementar un _document processor worker_ que escuche de RabbitMQ/Kafka y haga: `parse -> chunk -> embed -> index` | RabbitMQ (ligero, ya lo tienes en infra), Qdrant, FastAPI Worker                             |

📁 **Resultado**: todos los programas procesados, embebidos y
almacenados en Qdrant con metadatos.

### 🔹 Etapa 2: Generación y búsqueda de embeddings

| Paso    | Descripción                                                                                                            | Herramientas                                                                            |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **2.1** | Escoger el modelo de embedding local (ligero, preciso y multilingüe)                                                   | `BAAI/bge-small-en-v1.5` o `intfloat/multilingual-e5-small` con `sentence-transformers` |
| **2.2** | Exponer una API `/search?q=...` que: 1️⃣ genera embedding, 2️⃣ consulta Qdrant (top_k=10), 3️⃣ devuelve texto + metadatos | FastAPI + `qdrant-client`                                                               |
| **2.3** | Añadir filtros (por `partido`, `año`, `candidato`, etc.) como parámetros opcionales en la búsqueda                     | Qdrant permite filtros booleanos por `payload`                                          |
| **2.4** | Ranking final: opcionalmente re-rankear con modelo tipo `bge-reranker` local o por `score * relevancia_temporal`       | `bge-reranker-base` (si necesitas ranking semántico local)                              |

📁 **Resultado**: un endpoint de búsqueda semántica potente, preciso y
personalizable.

### 🔹 Etapa 3: Frontend (Búsqueda + visualización de resultados)

| Paso    | Descripción                                                          | Herramientas                                                         |
| ------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **3.1** | Implementar formulario de búsqueda + filtros por partido/candidato   | React + Tailwind + Zustand (si usas estado global)                   |
| **3.2** | Mostrar resultados con fragmentos relevantes (highlight) y metadatos | Destacar fragmentos con `...texto con <mark>palabra clave</mark>...` |
| **3.3** | Añadir paginación o scroll infinito (si hay muchos resultados)       | `react-infinite-scroll-component`                                    |

📁 **Resultado**: buscador usable por ciudadanos, con interfaz moderna
y clara.

### 🔹 Etapa 4: Escalabilidad y robustez

| Paso    | Descripción                                                                | Herramientas                                                      |
| ------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **4.1** | Indexar en paralelo desde múltiples workers (cola RabbitMQ, ack + retry)   | RabbitMQ durable queues                                           |
| **4.2** | Cachear queries frecuentes en Redis (búsqueda y resultados)                | `query_string -> top10_ids` (expira en 6h, por ejemplo)           |
| **4.3** | Sharding en Qdrant (por comunidad autónoma, elección, etc.) si crece mucho | Qdrant Clustering Mode (v1.7+) o múltiples instancias coordinadas |
| **4.4** | Logs, métricas, errores → Prometheus + Grafana                             | `prometheus_fastapi_instrumentator` + Dockerized Grafana          |

📁 **Resultado**: sistema robusto que puede escalar horizontalmente y
manejar errores.

### 🔹 Etapa 5: Evaluación y feedback

| Paso    | Descripción                                                                 | Herramientas                                                                |
| ------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **5.1** | Dataset de test: consultas típicas de votantes y sus “respuestas esperadas” | CSV con: `query,texto_relevante_expected`                                   |
| **5.2** | Mide precisión @k (¿está el programa correcto en top-10?)                   | Script de validación con recall/precision/accuracy                          |
| **5.3** | Feedback del usuario: añade botones 👍👎 a cada resultado                   | Grabar `query`, `result_id`, `feedback=1/-1` en Postgres para mejora futura |

📁 **Resultado**: capacidad de evaluar el sistema y adaptarlo a las
necesidades reales.

## 🧰 Requisitos base para local + gratuito

- 🔎 **Qdrant** local (modo Docker) → almacenamiento vectorial con
  filtros avanzados.
- 🧠 **Modelos de embeddings locales** (BGE-small, E5-small) → usan
  300–400MB de RAM y funcionan bien con CPU.
- 🐇 **RabbitMQ** → ya está en tu `docker-compose.yml`.
- 🐍 **FastAPI** como API REST para búsqueda e ingesta.
- 🐳 **Docker Compose** para empaquetarlo todo.

## 🚀 ¿Siguiente paso recomendado?

> Implementar un **script independiente** `processor.py` que:
>
> 1. Recorra `./programs/*.pdf`
> 2. Extraiga texto por página
> 3. Divida en chunks con metadatos
> 4. Genere los embeddings
> 5. Inserte en Qdrant
>
> Esto te dará la base del sistema sin necesidad de integrar aún el
> backend.
