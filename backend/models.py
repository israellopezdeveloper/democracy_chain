from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class UploadedFile(SQLModel, table=True):
    filename: str = Field(primary_key=True)
    wallet_address: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
