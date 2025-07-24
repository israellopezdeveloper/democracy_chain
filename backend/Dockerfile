FROM python:3.12-slim

RUN apt-get update && apt-get install -y libmagic1 curl && apt-get clean

# Crear usuario no root
RUN adduser --disabled-password --gecos '' clistenes

WORKDIR /app

# Instalar Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry

COPY . .

# Instalar dependencias (sin entorno virtual)
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi

# Dar permisos
RUN chown -R clistenes:clistenes /app

# CMD ajustado para apuntar a src/main.py -> app
COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh
USER clistenes

EXPOSE 8000
ENTRYPOINT ["/wait-for-it.sh", "mysql:3306", "--"]
CMD ["uvicorn", "src.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]

