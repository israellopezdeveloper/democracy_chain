from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class UploadedFile(SQLModel, table=True):
    filename: str = Field(primary_key=True)
    wallet_address: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    mime_type: str = ""

    def to_dict(self) -> dict:
        return {
            "filename": self.filename,
            "wallet_address": self.wallet_address,
            "created_at": self.created_at.isoformat(),
            "mime_type": self.mime_type,
        }

    def __hash__(self):
        return hash((self.filename, self.wallet_address))

    def __eq__(self, other):
        if isinstance(other, UploadedFile):
            return (
                self.filename == other.filename
                and self.wallet_address == other.wallet_address
            )
        return False
