from fastapi import APIRouter
from fastapi.responses import JSONResponse
from starlette.status import HTTP_200_OK

from backend.models.uploadedfile import UploadedFile
from backend.services import database, storage
from backend.services.rabbitmq import send_message

router = APIRouter(tags=["wallet"])


#   Read
@router.get("/wallets", response_class=JSONResponse)
async def list_wallets() -> JSONResponse:
    return JSONResponse(content=await database.read_wallets())


#   Delete
@router.delete("/{wallet_address}", response_class=JSONResponse)
async def delete_wallet(wallet_address: str) -> JSONResponse:
    try:
        await database.remove_wallet(wallet_address)
    except Exception:
        pass
    files: list[UploadedFile] = []
    try:
        files = storage.delete_all(wallet_address)
    except Exception:
        pass

    content: list[dict] = [file.to_dict() for file in files]
    await send_message(
        {
            "add": [],
            "remove": content,
        },
    )
    return JSONResponse(
        status_code=HTTP_200_OK,
        content={
            "deleted_count": len(files),
            "message": f"Cartera '{wallet_address}' eliminada",
            "deleted_filenames": content,
        },
    )
