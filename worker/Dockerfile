FROM pytorch/pytorch:2.7.1-cuda12.8-cudnn9-runtime

# Crear usuario no root
RUN useradd -m clistenes

WORKDIR /app

COPY requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY ingest.py .

# Cambiar propiedad y usar usuario no root
RUN chown -R clistenes:clistenes /app
USER clistenes

CMD ["python", "ingest.py"]

