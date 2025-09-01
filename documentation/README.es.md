# 🗳️ Democracy Chain

**Democracy Chain** es una plataforma orientada a facilitar la
comprensión de programas electorales mediante análisis automático de
documentos. Permite a los votantes descubrir qué candidatos se alinean
mejor con sus ideas utilizando procesamiento de lenguaje natural,
embeddings, blockchain y una base de datos vectorial. Además, incluye
una DApp basada en Web3 que permite interactuar con contratos
inteligentes en Ethereum.

Este proyecto nace con una doble motivación:

- **Practicar tecnologías Web3 y sistemas RAG (Retrieval-Augmented
  Generation)**.
- **Contribuir a una democracia más real y participativa**,
  facilitando el acceso transparente a las propuestas de los
  candidatos.

Mediante esta aplicación, cualquier ciudadano puede convertirse en
candidato, lo cual es deseable para la participación democrática. Sin
embargo, esto puede generar **una gran cantidad de candidatos**,
haciendo muy difícil para un votante elegir entre ellos de forma
informada.

La solución es crear un **buscador inteligente**, donde el votante
pueda describir en lenguaje natural qué tipo de propuestas o valores
busca en un candidato, y recibir como resultado los **10 candidatos
cuyos programas electorales sean más afines** a su consulta.

Esto fomentará el voto informado y reducirá la “infoxicación”
política.

## 📁 Estructura del proyecto

```text
.
├── docker-compose.yml   # Orquestación de servicios
├── backend/             # API REST para carga de archivos
│   ├── Dockerfile
│   ├── poetry.lock
│   ├── pyproject.toml   # Dependencias y configuración
│   └── src/backend/
│       ├── __init__.py
│       └── main.py      # Punto de entrada FastAPI
├── hardhat-node/        # Nodo local de Ethereum para pruebas (Hardhat)
├── deploy-contract/     # Scripts para desplegar el smart contract
├── frontend/            # Aplicación Web3 DApp con interacción con el contrato
│   ├── public/
│   ├── src/
│   └── package.json     # Proyecto probablemente con Vite + ethers.js
```

## 📊 Tecnologías utilizadas

- **FastAPI** — Framework principal del backend
- **Poetry** — Gestor de dependencias para Python
- **Qdrant** — Vector store para embeddings
- **SentenceTransformers** — Generación de vectores semánticos
- **RabbitMQ** — Cola de mensajes para procesamiento asincrónico
- **aio-pika** — Cliente async de RabbitMQ
- **Docker & docker-compose** — Orquestación de servicios
- **Hardhat** — Blockchain local para pruebas con contratos
  inteligentes
- **Solidity** — Lenguaje para smart contracts en Ethereum
- **ethers.js** — Librería JavaScript para interacción Web3
- **Vite / React** — Framework moderno para la DApp (asumido por la
  estructura)

## 🚀 Instalación y despliegue

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/democracy_chain.git
cd democracy_chain
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y modifica los valores
necesarios:

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

## 📄 Flujo de trabajo

1. El usuario sube un archivo vía API con un `wallet_address`
   asociado.
2. El backend almacena el archivo y lo envía al worker a través de
   RabbitMQ.
3. El worker:
   - Extrae texto según el `mime_type`
   - Lo divide en chunks
   - Genera embeddings
   - Inserta los vectores en Qdrant con metadatos

4. Los vectores están etiquetados con `wallet_address` para asociarlos
   al candidato correspondiente
5. La DApp permite consultar qué programa fue registrado en la
   blockchain, asociar el hash del archivo, y verificar que no haya
   sido alterado.

## 🛠 Uso del Makefile

> Requisitos:
>
> - **Podman** + **podman-compose** (o alias compatible con
>   `docker-compose`)
> - `fzf` para los menús interactivos
> - (Opcional) utilidades de banners en `~/.local/lib/bash/utils.sh`
>
>   > Si no las tienes, el Makefile seguirá funcionando; solo perderás
>   > el “arte” de los banners.

### Comandos rápidos

```bash
# Levantar servicios en segundo plano y esperar a que estén listos
make up

# Ver logs de todos los servicios (Ctrl+C para salir)
make logs

# Parar y eliminar contenedores huérfanos
make down

# Limpiar imágenes/volúmenes temporales y ficheros de ejemplo
make clean
```

### Menú interactivo de ejecución

```bash
make run
```

- Lanza los servicios y abre un menú con `fzf`:
  - `all` → logs de todos
  - `rebuild` → reconstruir (con o sin `--no-cache`)
  - `rerun` → reiniciar orquestación
  - `clean` → limpieza completa y relanzar
  - `check` → ejecuta la regla `check` (ver abajo)
  - O bien selecciona un **servicio concreto** para ver sus logs

### Build interactivo

```bash
make build
```

- Te deja elegir:
  - `all` → reconstruye todos los servicios (pregunta si forzar
    `--no-cache`)
  - Un servicio concreto → reconstruye solo ese

### Salud de los contenedores

```bash
make wait-healthy
```

- Espera hasta **`WAIT_TIMEOUT`** (por defecto 180s) a que todos los
  contenedores del proyecto estén en `healthy` o, si no tienen
  healthcheck, en `running`.

### Checks por subproyectos

Hay dos reglas para validar **subproyectos** (multi-repo):

```bash
# Interactivo: elige un subdirectorio con Makefile o "all"
make check

# No interactivo para CI: recorre todos los subdirectorios con Makefile
make check-ci
```

- Ambas buscan **Makefiles solo en subcarpetas directas** (profundidad
  1–2).
- `check` abre un selector `fzf` (puedes elegir uno o “all”).
- `check-ci` se usa en hooks/CI: **falla** en el primer subproyecto
  que falle.

### Scripts varios

```bash
# Registrar programas de ejemplo (carpeta examples/)
make programs

# Consolas utilitarias (si los contenedores correspondientes existen)
make hh-console
make backend-console
```

### Empaquetado

```bash
# Crea un zip del proyecto (excluye artefactos, node_modules, tests, etc.)
make create-zip
```

### Variables y personalización

- `PROJECT` → etiqueta de proyecto para filtrar contenedores
  (`io.podman.compose.project`). Por defecto es el nombre del
  directorio actual.
- `WAIT_TIMEOUT` → segundos máximos para `wait-healthy` (defecto:
  `180`).
- Si usas **Docker** en lugar de Podman, puedes crear un alias:

  ```bash
  alias podman-compose='docker compose'
  ```

  o adaptar la variable `COMPOSE` en el Makefile.

### Consejos y resolución de problemas

- Si el menú de `make run` no aparece, comprueba que `fzf` está
  instalado.
- Si `make wait-healthy` expira:
  - Mira `make logs` para ver qué servicio no inicia.
  - Revisa healthchecks o tiempos de arranque (DBs y LLM suelen
    tardar).

- Si usas GPU con contenedores, revisa que tu `docker/podman` tenga
  soporte (NVIDIA CDI/Runtime).

Con esto, cualquiera puede levantar, reconstruir, revisar y empaquetar
el proyecto **desde el Makefile** sin aprenderse todos los comandos de
orquestación.

## 📂 Formatos soportados (previstos)

- `.txt`, `.md`, `.html`, `.xml`, `.csv`
- `.pdf`, `.doc`, `.docx`, `.odt`
- `.xls`, `.xlsx`, `.ods`
- `.pptx`, `.odp`

> En versiones futuras se incluirá soporte para OCR de imágenes,
> transcripción de audio y video

## 📦 API (en desarrollo)

### Subir archivo

```sh
POST /api/v1/{wallet_address}/file
```

### Obtener candidatos sugeridos (planeado)

```sh
GET /api/v1/suggest?query="educación gratuita"
```

## 🪑 Limpieza de archivos

Cuando un archivo es eliminado:

- Se borra del almacenamiento.
- Se eliminan los vectores asociados en Qdrant filtrando por
  `wallet_address` y `filename`

## 🔐 Seguridad y blockchain

- Cada candidato se identifica con un `wallet_address` único.
- Se registra el hash de los documentos procesados en un smart
  contract en Ethereum local (Hardhat).
- La DApp permite a los votantes verificar en cadena que un archivo no
  ha sido alterado.
- Esto permite:
  - Verificación de integridad del programa electoral
  - Pruebas de autenticidad públicas

## 🔮 Futuras mejoras

- [ ] Panel de administración web
- [ ] API de consulta semántica
- [ ] Visualizaciones interactivas de coincidencias por candidato
- [ ] Evaluación de sentimiento y resumen de programas
- [ ] Registro de hashes en el contrato inteligente
- [ ] Interfaz pública para votantes en la DApp

[TODO](./TODO.es.md)

[ROADMAP](./ROADMAP.es.md)

## 👤 Autor

**Israel López** [GitHub](https://github.com/israellopezdeveloper) |
[LinkedIn](https://linkedin.com/in/israellopezmaiz)
