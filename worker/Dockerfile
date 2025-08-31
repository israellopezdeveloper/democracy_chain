FROM docker.io/pytorch/pytorch:2.7.1-cuda12.6-cudnn9-runtime

# Evitar prompts durante instalaciones
ENV DEBIAN_FRONTEND=noninteractive

# Crear usuario sin privilegios
RUN adduser --disabled-password --gecos '' clistenes

# Instalar dependencias necesarias del sistema
RUN pip install poetry

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar y preparar Poetry
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --no-interaction --no-ansi

# Copiar el código fuente
COPY src src
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# Usar el usuario sin privilegios

# Comando por defecto (puedes cambiarlo si usarás otro script)
CMD ["python", "src/worker/main.py"]
