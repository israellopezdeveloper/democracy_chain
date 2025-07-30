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
    LLM_URL: str = "http://llm:11434/api"
    LLM_MODEL: str = "llama2"
    # 🔧 Configuración constante del modelo
    LLM_SETTINGS: ClassVar[dict] = {
        "model": LLM_MODEL,
        "system": (
            "Eres un analista electoral imparcial. "
            "Tu trabajo es analizar extractos de programas electorales "
            "agrupados por wallet, y ayudar al ciudadano a encontrar "
            "los más alineados con sus criterios. Responde con claridad, "
            "sin inventar nada, y si es posible añade al final: "
            'WALLETS=["wallet1", "wallet2", ...]'
        ),
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
