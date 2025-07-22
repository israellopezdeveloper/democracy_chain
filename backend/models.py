from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class UploadedFile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    filename: str
    filepath: str
    wallet_address: str
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
    )
