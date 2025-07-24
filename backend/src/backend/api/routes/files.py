from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse
from starlette.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_404_NOT_FOUND

from backend.services import database, storage

router = APIRouter(tags=["files"])


#   Create
@router.post("/{wallet_address}/file", response_class=PlainTextResponse)
async def upload_file(
    wallet_address: str,
    file: UploadFile = File(...),  # noqa: B008
) -> PlainTextResponse:
    file_uploaded = storage.upload(file, wallet_address)
    await database.add(
        wallet_address,
        file_uploaded.filename,
        file_uploaded.mime_type,
    )

    return PlainTextResponse(
        content=file_uploaded.filename,
        status_code=HTTP_201_CREATED,
    )


#   Read
@router.get("/{wallet_address}/file", response_class=JSONResponse)
async def get_files(
    wallet_address: str,
) -> JSONResponse:
    files = await database.read_all(wallet_address)
    return JSONResponse(
        status_code=HTTP_200_OK,
        content=[file.to_dict() for file in files if file.filename != "main"],
    )


@router.get("/{wallet_address}/file/{fileid}", response_class=JSONResponse)
async def get_file(
    wallet_address: str,
    fileid: str,
) -> JSONResponse:
    if fileid == "main":
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    file = await database.read(wallet_address, fileid)
    return JSONResponse(
        status_code=HTTP_200_OK,
        content=file.to_dict(),
    )


@router.get(
    "/{wallet_address}/file/{filename}/download",
    response_class=FileResponse,
)
async def download_file(
    wallet_address: str,
    filename: str,
):
    if filename == "main":
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    try:
        file = storage.get(filename, wallet_address)
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        ) from e

    return file


@router.get(
    "/{wallet_address}/file/{filename}/base64",
    response_class=PlainTextResponse,
)
async def get_file_base64(wallet_address: str, filename: str):
    try:
        return PlainTextResponse(
            content=storage.get_base64(filename, wallet_address),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading file: {str(e)}",
        ) from e


#   Remove
@router.delete("/{wallet_address}/file", response_class=JSONResponse)
async def delete_files(
    wallet_address: str,
) -> JSONResponse:
    try:
        files = list(
            set(
                await database.remove_all(wallet_address)
                + storage.delete_all(wallet_address)
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="No files found to delete",
        ) from e

    return JSONResponse(
        status_code=HTTP_200_OK,
        content={
            "deleted_count": len(files),
            "deleted_filenames": [file.to_dict() for file in files],
        },
    )


@router.delete("/{wallet_address}/file/{fileid}", response_class=JSONResponse)
async def delete_file(
    wallet_address: str,
    fileid: str,
) -> JSONResponse:
    if fileid == "main":
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )
    try:
        files = list(
            set(
                await database.remove(wallet_address, fileid)
                + storage.delete(fileid, wallet_address)
            )
        )
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        ) from e

    return JSONResponse(
        status_code=HTTP_200_OK,
        content={
            "deleted_count": len(files),
            "deleted_filenames": [file.to_dict() for file in files],
        },
    )
