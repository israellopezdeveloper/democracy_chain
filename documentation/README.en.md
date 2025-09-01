# 🗳️ Democracy Chain

**Democracy Chain** is a platform designed to make it easier to
understand electoral programs through automated document analysis. It
allows voters to discover which candidates best align with their ideas
using natural language processing, embeddings, blockchain, and a
vector database. It also includes a Web3-based DApp that enables
interaction with smart contracts on Ethereum.

This project was born with a dual motivation:

- **Practice Web3 technologies and RAG (Retrieval-Augmented
  Generation) systems**.
- **Contribute to a more real and participatory democracy**, by
  providing transparent access to candidates’ proposals.

With this application, any citizen can become a candidate, which is
desirable for democratic participation. However, this can generate **a
large number of candidates**, making it very difficult for a voter to
choose among them in an informed way.

The solution is to create an **intelligent search engine**, where the
voter can describe in natural language what kind of proposals or
values they are looking for in a candidate, and receive as a result
the **10 candidates whose electoral programs best match** their query.

This will encourage informed voting and reduce political
“infodemic/overload”.

## 📁 Project structure

```text
.
├── docker-compose.yml   # Service orchestration
├── backend/             # REST API for file upload
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml   # Dependencies and configuration
│   └── src/backend/
│       ├── __init__.py
│       └── main.py      # FastAPI entry point
├── hardhat-node/        # Local Ethereum node for testing (Hardhat)
├── deploy-contract/     # Scripts to deploy the smart contract
├── frontend/            # Web3 DApp with contract interaction
│   ├── public/
│   ├── src/
│   └── package.json     # Likely a Vite + ethers.js project
```

## 📊 Technologies used

- **FastAPI** — Main backend framework
- **Poetry** — Dependency manager for Python
- **Qdrant** — Vector store for embeddings
- **SentenceTransformers** — Semantic vector generation
- **RabbitMQ** — Message queue for asynchronous processing
- **aio-pika** — Async client for RabbitMQ
- **Docker & docker-compose** — Service orchestration
- **Hardhat** — Local blockchain for testing smart contracts
- **Solidity** — Language for Ethereum smart contracts
- **ethers.js** — JavaScript library for Web3 interaction
- **Vite / React** — Modern framework for the DApp (assumed from
  structure)

## 🚀 Installation and deployment

### 1. Clone the repository

```bash
git clone https://github.com/your_user/democracy_chain.git
cd democracy_chain
```

### 2. Configure environment variables

Copy the `.env.example` file to `.env` and update values as needed:

```bash
cp .env.example .env
```

### 3. Build and start the services

```bash
docker-compose up --build
```

This will start:

- The backend at `http://localhost:8000`
- RabbitMQ and Qdrant on their respective ports
- A local Ethereum node (Hardhat)
- Automatic deployment of the smart contract
- The DApp frontend at `http://localhost:5173` (default for Vite)

## 📄 Workflow

1. The user uploads a file via API with an associated
   `wallet_address`.

2. The backend stores the file and sends it to the worker through
   RabbitMQ.

3. The worker:
   - Extracts text based on `mime_type`
   - Splits it into chunks
   - Generates embeddings
   - Inserts vectors into Qdrant with metadata

4. Vectors are tagged with `wallet_address` to associate them with the
   candidate.

5. The DApp lets users check which program was registered on the
   blockchain, associate the file hash, and verify it has not been
   altered.

## 🛠 Makefile usage

> Requirements:
>
> - **Podman** + **podman-compose** (or alias compatible with
>   `docker-compose`)
> - `fzf` for interactive menus
> - (Optional) banner utilities in `~/.local/lib/bash/utils.sh`
>
>   > If you don’t have them, the Makefile will still work; you’ll
>   > just lose the banner “art”.

### Quick commands

```bash
# Start services in the background and wait until ready
make up

# View logs from all services (Ctrl+C to exit)
make logs

# Stop and remove orphan containers
make down

# Clean temporary images/volumes and example files
make clean
```

### Interactive run menu

```bash
make run
```

- Starts services and opens a menu with `fzf`:
  - `all` → logs for all
  - `rebuild` → rebuild (with or without `--no-cache`)
  - `rerun` → restart orchestration
  - `clean` → full cleanup and restart
  - `check` → run the `check` rule (see below)
  - Or select a **specific service** to see its logs

### Interactive build

```bash
make build
```

- Lets you choose:
  - `all` → rebuild all services (asks if forcing `--no-cache`)
  - A specific service → rebuild only that one

### Container health

```bash
make wait-healthy
```

- Waits until **`WAIT_TIMEOUT`** (default 180s) for all project
  containers to be `healthy`, or if no healthcheck, at least
  `running`.

### Subproject checks

There are two rules to validate **subprojects** (multi-repo):

```bash
# Interactive: choose a subdirectory with Makefile or "all"
make check

# Non-interactive for CI: runs all subdirectories with Makefile
make check-ci
```

- Both look for **Makefiles only in direct subfolders** (depth 1–2).
- `check` opens an `fzf` selector (pick one or “all”).
- `check-ci` is used in hooks/CI: **fails** at the first subproject
  error.

### Misc scripts

```bash
# Register sample programs (examples/ folder)
make programs

# Utility consoles (if containers exist)
make hh-console
make backend-console
```

### Packaging

```bash
# Create a zip of the project (excludes artifacts, node_modules, tests, etc.)
make create-zip
```

### Variables and customization

- `PROJECT` → project label to filter containers
  (`io.podman.compose.project`). Default is the current directory
  name.
- `WAIT_TIMEOUT` → max seconds for `wait-healthy` (default: `180`).
- If you use **Docker** instead of Podman, you can alias:

  ```bash
  alias podman-compose='docker compose'
  ```

  or adapt the `COMPOSE` variable in the Makefile.

### Tips and troubleshooting

- If the `make run` menu doesn’t appear, check that `fzf` is
  installed.

- If `make wait-healthy` times out:
  - Check `make logs` to see which service failed to start.
  - Review healthchecks or startup times (DBs and LLMs usually take
    longer).

- If using GPU with containers, ensure your `docker/podman` supports
  it (NVIDIA CDI/Runtime).

With this, anyone can start, rebuild, check, and package the project
**from the Makefile** without memorizing orchestration commands.

## 📂 Supported formats (planned)

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> Future versions will include OCR support for images, and audio/video
> transcription.

## 📦 API (in development)

### Upload file

```sh
POST /api/v1/{wallet_address}/file
```

### Get suggested candidates (planned)

```sh
GET /api/v1/suggest?query="free education"
```

## 🪑 File cleanup

When a file is deleted:

- It is removed from storage.
- Associated vectors in Qdrant are deleted, filtered by
  `wallet_address` and `filename`.

## 🔐 Security and blockchain

- Each candidate is identified by a unique `wallet_address`.
- The hash of processed documents is recorded in a local Ethereum
  smart contract (Hardhat).
- The DApp allows voters to verify on-chain that a file has not been
  altered.
- This enables:
  - Integrity verification of the electoral program
  - Public authenticity proofs

## 🔮 Future improvements

- [ ] Web administration panel
- [ ] Semantic query API
- [ ] Interactive visualizations of matches per candidate
- [ ] Sentiment analysis and program summarization
- [ ] Hash registration in the smart contract
- [ ] Public voter interface in the DApp

[TODO](./TODO.en.md)

[ROADMAP](./ROADMAP.en.md)

## 👤 Author

**Israel López** [GitHub](https://github.com/israellopezdeveloper) |
[LinkedIn](https://linkedin.com/in/israellopezmaiz)
