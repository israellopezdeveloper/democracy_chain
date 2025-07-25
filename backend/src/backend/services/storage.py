import datetime
import os
from base64 import b64encode
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

import magic
from fastapi import HTTPException, UploadFile
from fastapi.responses import FileResponse
from starlette.status import HTTP_404_NOT_FOUND, HTTP_409_CONFLICT

from backend.core.config import settings
from backend.models.uploadedfile import UploadedFile


def detect_mime_type(file_path: str) -> str:
    try:
        mime = magic.Magic(mime=True)
        return mime.from_file(file_path)
    except Exception:
        return "application/octet-stream"


def upload(file: UploadFile, wallet_address: str) -> UploadedFile:
    file_id = str(uuid4())
    filename: str = file_id + ("_" + file.filename if file.filename else "")

    user_dir = os.path.join(settings.UPLOAD_DIR, wallet_address)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, filename)

    with open(file_path, "wb") as buffer:
        copyfileobj(file.file, buffer)
    return UploadedFile(
        filename=filename,
        wallet_address=wallet_address,
        mime_type=detect_mime_type(file_path),
        created_at=datetime.datetime.fromtimestamp(Path(file_path).stat().st_ctime),
    )


def upload_main(
    file: UploadFile,
    wallet_address: str,
    overwrite: bool = True,
) -> UploadedFile:
    filename: str = "main"

    user_dir = os.path.join(settings.UPLOAD_DIR, wallet_address)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, filename)

    main_exists = os.path.exists(file_path)
    if main_exists and not overwrite:
        raise HTTPException(
            status_code=HTTP_409_CONFLICT,
            detail="A program file already exists for this wallet.",
        )

    with open(file_path, "wb") as buffer:
        copyfileobj(file.file, buffer)
    return UploadedFile(
        filename=filename,
        wallet_address=wallet_address,
        mime_type=detect_mime_type(file_path),
        created_at=datetime.datetime.fromtimestamp(Path(file_path).stat().st_ctime),
    )


def get(filename: str, wallet_address: str) -> FileResponse:
    file_path = os.path.join(settings.UPLOAD_DIR, wallet_address, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(path=file_path, media_type=detect_mime_type(file_path))


def get_base64(filename: str, wallet_address: str) -> str:
    file_path = os.path.join(settings.UPLOAD_DIR, wallet_address, filename)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    with open(file_path, "rb") as f:
        encoded = b64encode(f.read()).decode("utf-8")

    data_url = f"data:{detect_mime_type(file_path)};base64,{encoded}"
    return data_url


def delete_all(wallet_address: str) -> list[UploadedFile]:
    folder_path = os.path.join(settings.UPLOAD_DIR, wallet_address)
    folder = Path(folder_path)
    files: list[UploadedFile] = []
    for path in folder.iterdir():
        if path.is_file():
            if path.name == "main":
                continue
            file_path = os.path.join(folder_path, path.name)
            upload = UploadedFile(
                filename=path.name,
                wallet_address=wallet_address,
                mime_type=detect_mime_type(file_path),
                created_at=datetime.datetime.fromtimestamp(path.stat().st_ctime),
            )
            files.append(upload)
            os.remove(
                os.path.join(
                    folder_path,
                    path.name,
                )
            )
    folder_path = os.path.join(settings.UPLOAD_DIR, wallet_address)
    try:
        os.rmdir(folder_path)
    except OSError:
        pass
    return files


def delete(fileid: str, wallet_address: str) -> list[UploadedFile]:
    if fileid == "main":
        return []
    folder_path = os.path.join(settings.UPLOAD_DIR, wallet_address, fileid)
    time = datetime.datetime.fromtimestamp(Path(folder_path).stat().st_ctime)
    os.remove(folder_path)
    upload = UploadedFile(
        filename=fileid,
        wallet_address=wallet_address,
        mime_type=detect_mime_type(folder_path),
        created_at=time,
    )
    files: list[UploadedFile] = []
    files.append(upload)
    folder_path = os.path.join(settings.UPLOAD_DIR, wallet_address)
    try:
        os.rmdir(folder_path)
    except OSError:
        pass
    return files


def delete_main(wallet_address: str) -> list[UploadedFile]:
    folder_path = os.path.join(settings.UPLOAD_DIR, wallet_address, "main")
    time = datetime.datetime.fromtimestamp(Path(folder_path).stat().st_ctime)
    os.remove(folder_path)
    upload = UploadedFile(
        filename="main",
        wallet_address=wallet_address,
        mime_type=detect_mime_type(folder_path),
        created_at=time,
    )
    files: list[UploadedFile] = []
    files.append(upload)
    try:
        os.rmdir(os.path.join(settings.UPLOAD_DIR, wallet_address))
    except OSError:
        pass
    return files
