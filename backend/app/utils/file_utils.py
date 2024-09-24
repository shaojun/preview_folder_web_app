import os
from fastapi import HTTPException
import base64
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_directory_contents(path):
    try:
        contents = []
        for item in os.listdir(path):
            item_path = os.path.join(path, item)
            contents.append({
                "name": item,
                "type": "directory" if os.path.isdir(item_path) else "file",
                "image_base64": get_image_base64_str(item_path) if os.path.isfile(item_path) and item_path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')) else None,
                "size": os.path.getsize(item_path) if os.path.isfile(item_path) else None,
                "lastModified": os.path.getmtime(item_path)
            })
        return contents
    except Exception as e:
        logger.error(f"Error getting directory contents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_image_base64_str(path)->str:
    try:
        with open(path, 'rb') as file:
            content = base64.b64encode(file.read()).decode('utf-8')
        return content
    except Exception as e:
        logger.error(f"Error getting image base64: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_file_content(path):
    try:
        if os.path.isdir(path):
            raise HTTPException(status_code=400, detail="Path is a directory, not a file")
        if path.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            base64_str = get_image_base64_str(path)
            return {"content": f"data:image/{path.split('.')[-1]};base64,{base64_str}"}
        else:
            with open(path, 'r') as file:
                content = file.read()
            return {"content": content}
    except Exception as e:
        logger.error(f"Error getting file content: {e}")
        raise HTTPException(status_code=500, detail=str(e))