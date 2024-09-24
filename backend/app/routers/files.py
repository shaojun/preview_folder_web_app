from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from utils.file_utils import get_directory_contents, get_file_content
import os
import json
import logging
import urllib.parse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

with open("../app.config") as config_file:
    config = json.load(config_file)
    ROOT_PATHS = config["root_paths"]

@router.get("/api/source-paths")
async def get_source_paths():
    return {"paths": ROOT_PATHS}

@router.get("/api/files")
async def list_files(path: str = "", page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100)):
    path = urllib.parse.unquote(path)
    for root_path in ROOT_PATHS:
        full_path = os.path.join(root_path, path)
        if os.path.exists(full_path):
            contents = get_directory_contents(full_path)
            start = (page - 1) * limit
            end = start + limit
            return {
                "items": contents[start:end],
                "has_more": len(contents) > end
            }
    raise HTTPException(status_code=404, detail="Path not found")

@router.get("/api/preview")
async def preview_file(path: str):
    path = urllib.parse.unquote(path)
    for root_path in ROOT_PATHS:
        full_path = os.path.join(root_path, path)
        if os.path.exists(full_path):
            try:
                file_content = get_file_content(full_path)
                return file_content
            except Exception as e:
                logger.error(f"Error previewing file: {e}")
                raise HTTPException(status_code=500, detail="Error previewing file")
    raise HTTPException(status_code=404, detail="File not found")

@router.get("/api/download")
async def download_file(path: str):
    path = urllib.parse.unquote(path)
    for root_path in ROOT_PATHS:
        full_path = os.path.join(root_path, path)
        if os.path.exists(full_path):
            return FileResponse(full_path, filename=os.path.basename(full_path))
    raise HTTPException(status_code=404, detail="File not found")