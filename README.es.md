# 🗳️ Democracy Chain

**Democracy Chain** es una plataforma orientada a facilitar la comprensión de programas electorales mediante análisis automático de documentos. Permite a los votantes descubrir qué candidatos se alinean mejor con sus ideas utilizando procesamiento de lenguaje natural, embeddings, blockchain y una base de datos vectorial. Además, incluye una DApp basada en Web3 que permite interactuar con contratos inteligentes en Ethereum.

Este proyecto nace con una doble motivación:

- **Practicar tecnologías Web3 y sistemas RAG (Retrieval-Augmented Generation)**.
- **Contribuir a una democracia más real y participativa**, facilitando el acceso transparente a las propuestas de los candidatos.

---

## 📁 Estructura del proyecto

```
.
├── docker-compose.yml         # Orquestación de servicios
├── backend/                   # API REST para carga de archivos
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml         # Dependencias y configuración
│   └── src/backend/
│       ├── __init__.py
│       └── main.py            # Punto de entrada FastAPI
├── hardhat-node/              # Nodo local de Ethereum para pruebas (Hardhat)
├── deploy-contract/           # Scripts para desplegar el smart contract
├── frontend/                  # Aplicación Web3 DApp con interacción con el contrato
│   ├── public/
│   ├── src/
│   └── package.json           # Proyecto probablemente con Vite + ethers.js
```

---

## 📊 Tecnologías utilizadas

- **FastAPI** — Framework principal del backend
- **Poetry** — Gestor de dependencias para Python
- **Qdrant** — Vector store para embeddings
- **SentenceTransformers** — Generación de vectores semánticos
- **RabbitMQ** — Cola de mensajes para procesamiento asincrónico
- **aio-pika** — Cliente async de RabbitMQ
- **Docker & docker-compose** — Orquestación de servicios
- **Hardhat** — Blockchain local para pruebas con contratos inteligentes
- **Solidity** — Lenguaje para smart contracts en Ethereum
- **ethers.js** — Librería JavaScript para interacción Web3
- **Vite / React** — Framework moderno para la DApp (asumido por la estructura)

---

## 🚀 Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/democracy_chain.git
cd democracy_chain
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y modifica los valores necesarios:

```bash
cp .env.example .env
```

### 3. Construir y levantar los servicios

```bash
docker-compose up --build
```

Esto levantará:

- El backend en `http://localhost:8000`
- RabbitMQ y Qdrant en sus respectivos puertos
- Un nodo local de Ethereum (Hardhat)
- Despliegue automático del smart contract
- Frontend de la DApp en `http://localhost:5173` (por defecto en Vite)

---

## 📄 Flujo de trabajo

1. El usuario sube un archivo vía API con un `wallet_address` asociado.
2. El backend almacena el archivo y lo envía al worker a través de RabbitMQ.
3. El worker:
   - Extrae texto según el `mime_type`
   - Lo divide en chunks
   - Genera embeddings
   - Inserta los vectores en Qdrant con metadatos

4. Los vectores están etiquetados con `wallet_address` para asociarlos al candidato correspondiente
5. La DApp permite consultar qué programa fue registrado en la blockchain, asociar el hash del archivo, y verificar que no haya sido alterado.

---

## 📂 Formatos soportados (previstos)

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> En versiones futuras se incluirá soporte para OCR de imágenes, transcripción de audio y video

---

## 📦 API (en desarrollo)

### Subir archivo

```
POST /api/v1/{wallet_address}/file
```

### Obtener candidatos sugeridos (planeado)

```
GET /api/v1/suggest?query="educación gratuita"
```

---

## 🪑 Limpieza de archivos

Cuando un archivo es eliminado:

- Se borra del almacenamiento.
- Se eliminan los vectores asociados en Qdrant filtrando por `wallet_address` y `filename`

---

## 🔐 Seguridad y blockchain

- Cada candidato se identifica con un `wallet_address` único.
- Se registra el hash de los documentos procesados en un smart contract en Ethereum local (Hardhat).
- La DApp permite a los votantes verificar en cadena que un archivo no ha sido alterado.
- Esto permite:
  - Verificación de integridad del programa electoral
  - Pruebas de autenticidad públicas

---

## 🔮 Futuras mejoras

- [ ] Panel de administración web
- [ ] API de consulta semántica
- [ ] Visualizaciones interactivas de coincidencias por candidato
- [ ] Evaluación de sentimiento y resumen de programas
- [ ] Registro de hashes en el contrato inteligente
- [ ] Interfaz pública para votantes en la DApp

---

## 👤 Autor

**Israel López**
[GitHub](https://github.com/tu_usuario) | [LinkedIn](https://linkedin.com/in/tu_usuario)
