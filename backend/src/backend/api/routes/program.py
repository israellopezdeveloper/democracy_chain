from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.status import (
    HTTP_200_OK,
    HTTP_201_CREATED,
    HTTP_409_CONFLICT,
)

from backend.services import database, storage

router = APIRouter(tags=["programs"])


#   Create
@router.post("/{wallet_address}/program", response_class=PlainTextResponse)
async def program(
    wallet_address: str,
    file: UploadFile = File(...),  # noqa: B008
    overwrite: bool = Form(False),
):
    try:
        uploaded_file = storage.upload_main(file, wallet_address, overwrite)
        await database.add(
            wallet_address,
            "main",
            uploaded_file.mime_type,
        )

    except Exception as err:
        if not overwrite:
            raise HTTPException(
                status_code=HTTP_409_CONFLICT,
                detail="A program file already exists for this wallet.",
            ) from err

    return PlainTextResponse(
        content=uploaded_file.filename,
        status_code=HTTP_201_CREATED,
    )


#   Read
@router.get("/{wallet_address}/program", response_class=Response)
async def read_program(wallet_address: str):
    file = storage.get("main", wallet_address)
    with open(file.path, "rb") as f:
        return Response(content=f.read(), media_type="application/octet-stream")


#  Delete
@router.delete("/{wallet_address}/program", response_class=JSONResponse)
async def delete_program(wallet_address: str) -> JSONResponse:
    files = list(
        set(
            await database.remove_program(wallet_address)
            + storage.delete_main(wallet_address)
        )
    )
    return JSONResponse(
        status_code=HTTP_200_OK,
        content=[file.to_dict() for file in files],
    )
