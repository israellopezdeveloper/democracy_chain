# 🗳️ Democracy Chain

**Democracy Chain** is a platform designed to facilitate the understanding of electoral programs through automatic document analysis. It helps voters discover which candidates best align with their ideas using natural language processing, embeddings, blockchain, and a vector database. It also includes a Web3-based DApp that interacts with smart contracts on Ethereum.

This project is driven by two key motivations:

- **To practice with Web3 technologies and RAG (Retrieval-Augmented Generation) systems**.
- **To contribute to a more authentic and participatory democracy**, by making candidate proposals more accessible and verifiable.

---

## 📁 Project Structure

```
.
├── docker-compose.yml         # Service orchestration
├── backend/                   # REST API for file uploads
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml         # Dependencies and configuration
│   └── src/backend/
│       ├── __init__.py
│       └── main.py            # FastAPI entry point
├── hardhat-node/              # Local Ethereum node for testing (Hardhat)
├── deploy-contract/           # Scripts to deploy the smart contract
├── frontend/                  # Web3 DApp for contract interaction
│   ├── public/
│   ├── src/
│   └── package.json           # Likely a Vite + ethers.js project
```

---

## 📊 Technologies Used

- **FastAPI** — Backend framework
- **Poetry** — Dependency management for Python
- **Qdrant** — Vector store for embeddings
- **SentenceTransformers** — Semantic vector generation
- **RabbitMQ** — Message queue for async processing
- **aio-pika** — Async client for RabbitMQ
- **Docker & docker-compose** — Service orchestration
- **Hardhat** — Local blockchain framework for smart contracts
- **Solidity** — Smart contract language for Ethereum
- **ethers.js** — JavaScript library for Web3 interaction
- **Vite / React** — Modern frontend stack for the DApp (assumed)

---

## 🚀 Installation & Deployment

### 1. Clone the repository

```bash
git clone https://github.com/your_user/democracy_chain.git
cd democracy_chain
```

### 2. Configure environment variables

Copy the `.env.example` file to `.env` and edit the necessary values:

```bash
cp .env.example .env
```

### 3. Build and start services

```bash
docker-compose up --build
```

This will launch:

- The backend at `http://localhost:8000`
- RabbitMQ and Qdrant on their respective ports
- A local Ethereum node (Hardhat)
- Auto-deployment of the smart contract
- The DApp frontend at `http://localhost:5173` (Vite default)

---

## 📄 Workflow

1. A user uploads a file via the API with an associated `wallet_address`.
2. The backend stores the file and sends it to the worker via RabbitMQ.
3. The worker:
   - Extracts text based on the `mime_type`
   - Splits the text into chunks
   - Generates embeddings
   - Inserts vectors into Qdrant with metadata

4. Vectors are tagged with the `wallet_address` to associate them with the corresponding candidate
5. The DApp lets users verify which program was registered on the blockchain, associate file hashes, and check for tampering.

---

## 📂 Supported File Formats (planned)

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> Future versions will support OCR for images, audio transcription, and video processing.

---

## 📦 API (in progress)

### Upload file

```
POST /api/v1/{wallet_address}/file
```

### Get recommended candidates (planned)

```
GET /api/v1/suggest?query="free education"
```

---

## 🧹 File Cleanup

When a file is deleted:

- It is removed from local storage.
- Its associated vectors in Qdrant are deleted based on `wallet_address` and `filename`.

---

## 🔐 Security and Blockchain

- Each candidate is identified by a unique `wallet_address`.
- The hash of each processed document is registered in a smart contract on the local Ethereum network (Hardhat).
- The DApp allows voters to verify on-chain that the document hasn’t been altered.
- This enables:
  - Integrity verification of the electoral program
  - Public proof of authenticity

---

## 🔮 Future Improvements

- [ ] Web admin dashboard
- [ ] Semantic query API
- [ ] Interactive visualizations of candidate similarity
- [ ] Sentiment analysis and summarization of programs
- [ ] On-chain hash registration
- [ ] Public voter-facing interface in the DApp

---

## 👤 Author

**Israel López**
[GitHub](https://github.com/your_user) | [LinkedIn](https://linkedin.com/in/your_user)
