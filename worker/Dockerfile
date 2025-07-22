FROM python:3.12-slim

# Crear usuario no root
RUN adduser --disabled-password --gecos '' clistenes

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ingest.py .

# Cambiar propiedad y usar usuario no root
RUN chown -R clistenes:clistenes /app
USER clistenes

CMD ["python", "ingest.py"]
