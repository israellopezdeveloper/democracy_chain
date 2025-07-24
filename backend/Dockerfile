FROM python:3.12-slim

RUN apt-get update && apt-get install -y libmagic1 && apt-get clean

# Crear usuario no root
RUN adduser --disabled-password --gecos '' clistenes

WORKDIR /app

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la app
COPY . .

# Cambiar propiedad y usar usuario no root
RUN chown -R clistenes:clistenes /app
USER clistenes

EXPOSE 8000

# Quitar reload para production
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
