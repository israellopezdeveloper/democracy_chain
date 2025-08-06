import os

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/democracy")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE", "democracy")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/data/uploads")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L12-v2")
