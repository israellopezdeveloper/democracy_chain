# 📍 ROADMAP — Democracy Chain RAG System

## 🧠 Final Objective of the RAG System

**Input:** A voter's preference in natural language
**Output:** The 10 programs most aligned with that preference

---

## 🗺️ Detailed Roadmap to Implement RAG

### 🔹 Stage 1: Mass Document Ingestion

| Step | Description                                                                                                 | Tools                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1.1  | Standardize input format (PDF, Word, txt, etc.)                                                             | `unstructured`, `pdfminer`, `docx`                                                        |
| 1.2  | Smart text chunking with metadata                                                                           | `langchain.text_splitter.RecursiveCharacterTextSplitter` or `unstructured.chunking`       |
| 1.3  | Store documents with metadata (`candidate`, `party`, `year`, etc.)                                          | Qdrant with structured payloads (`source_id`, `title`, `page`, `party`, `filename`, etc.) |
| 1.4  | Implement a document processor worker that listens to RabbitMQ/Kafka to: `parse -> chunk -> embed -> index` | RabbitMQ (lightweight, already in infra), Qdrant, FastAPI Worker                          |

📁 **Result**: All programs processed, embedded, and stored in Qdrant with metadata.

---

### 🔹 Stage 2: Embedding Generation and Search

| Step | Description                                                                                              | Tools                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 2.1  | Choose local embedding model (lightweight, accurate, multilingual)                                       | `BAAI/bge-small-en-v1.5` or `intfloat/multilingual-e5-small` with `sentence-transformers` |
| 2.2  | Expose `/search?q=...` API: 1️⃣ generate embedding, 2️⃣ query Qdrant (top_k=10), 3️⃣ return text + metadata | FastAPI + `qdrant-client`                                                                 |
| 2.3  | Add optional filters (`party`, `year`, `candidate`, etc.) in the search query                            | Qdrant supports boolean filters via `payload`                                             |
| 2.4  | Final ranking: optionally re-rank results with `bge-reranker` or time-relevance weighted score           | `bge-reranker-base` for local semantic re-ranking                                         |

📁 **Result**: A powerful, accurate, and customizable semantic search API.

---

### 🔹 Stage 3: Frontend (Search + Visualization)

| Step | Description                                               | Tools                                         |
| ---- | --------------------------------------------------------- | --------------------------------------------- |
| 3.1  | Implement search form + filters by party/candidate        | React + Tailwind + Zustand (for global state) |
| 3.2  | Display results with relevant text fragments and metadata | Highlight fragments with `<mark>` tag         |
| 3.3  | Add pagination or infinite scroll if many results         | `react-infinite-scroll-component`             |

📁 **Result**: A user-friendly search interface for citizens.

---

### 🔹 Stage 4: Scalability & Robustness

| Step | Description                                                  | Tools                                                       |
| ---- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| 4.1  | Parallel indexing using multiple workers (queue ack + retry) | Durable RabbitMQ queues                                     |
| 4.2  | Cache frequent queries and results in Redis                  | `query_string -> top10_ids` (expires after 6h, for example) |
| 4.3  | Shard Qdrant if needed (by region, election, etc.)           | Qdrant Clustering (v1.7+) or multiple coordinated instances |
| 4.4  | Logging, metrics, error tracking → Prometheus + Grafana      | `prometheus_fastapi_instrumentator` + Dockerized Grafana    |

📁 **Result**: A robust, horizontally scalable system with monitoring.

---

### 🔹 Stage 5: Evaluation & Feedback

| Step | Description                                                   | Tools                                                                        |
| ---- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 5.1  | Create test dataset: typical queries + expected ideal results | CSV with: `query,text_relevant_expected`                                     |
| 5.2  | Measure precision\@k, recall, etc.                            | Python script for recall/precision/accuracy                                  |
| 5.3  | Collect user feedback: thumbs up/down for each result         | Log `query`, `result_id`, `feedback=1/-1` to Postgres for later improvements |

📁 **Result**: System evaluation and real-user-driven improvement.

---

## 🧰 Minimal Free Local Requirements

- 🔎 **Qdrant** (Docker) → vector DB with advanced filtering
- 🧠 **Local Embedding Models** (BGE-small, E5-small) → lightweight and CPU-friendly
- 🐇 **RabbitMQ** → already in `docker-compose.yml`
- 🐍 **FastAPI** → for REST API ingestion and search
- 🐳 **Docker Compose** → to orchestrate everything locally

---

## 🚀 Suggested Next Step

> Build an **independent script** `processor.py` that:
>
> 1. Iterates through `./programs/*.pdf`
> 2. Extracts text per page
> 3. Splits into chunks with metadata
> 4. Generates embeddings
> 5. Inserts into Qdrant
>
> This gives you a working base without full backend integration.
