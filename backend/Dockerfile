FROM python:3.12-slim

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

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
