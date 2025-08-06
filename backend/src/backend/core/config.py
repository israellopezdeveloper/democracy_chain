from typing import Annotated, Any, ClassVar

from pydantic import AnyUrl, BeforeValidator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "local"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str,
        BeforeValidator(parse_cors),
    ] = []

    PROJECT_NAME: str = "Democracy Backend"

    MYSQL_URL: str
    RABBITMQ_URL: str = "amqp://guest:guest@rabbitmq:5672/democracy"
    RABBITMQ_QUEUE: str = "democracy"
    UPLOAD_DIR: str = "/data/uploads"
    FRONTEND_HOST: str = "http://localhost"
    QDRANT_URL: str = "http://qdrant:6333/"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    LLM_URL: str = "http://llm:11434/api/chat"
    LLM_MODEL: str = "llama2"
    # 🔧 Configuración constante del modelo
    LLM_SETTINGS: ClassVar[dict] = {
        "model": LLM_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Eres un analista electoral imparcial. Responde siempre "
                    "en español. Analiza los programas electorales agrupados "
                    "por wallet y responde de forma muy breve cuál o cuáles "
                    "se alinean mejor con los criterios del ciudadano. No "
                    "justifiques tu elección. Termina SIEMPRE con la línea:\n"
                    'WALLETS=["0x..."]'
                ),
            },
        ],
        "temperature": 0.3,
        "stream": False,
    }

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"{self.MYSQL_URL}"

    @property
    def all_cors_origins(self) -> list[str]:
        res: list = []
        res += [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS]
        res += [self.FRONTEND_HOST]
        return res


settings = Settings()  # type: ignore
