import hashlib
import base64

from baidubce.bce_client_configuration import BceClientConfiguration
from baidubce.auth.bce_credentials import BceCredentials
from baidubce.services.bos.bos_client import BosClient
from fastapi import UploadFile, HTTPException

from app.services import is_file_allowed, MAX_FILE_SIZE
from app.core.config import Config

bos_endpoint = Config.BAIDU_BOS_ENDPOINT
access_key_id = Config.BAIDU_BOS_ACCESS_KEY_ID
secret_access_key = Config.BAIDU_BOS_SECRET_ACCESS_KEY
bucket_name = Config.BAIDU_BOS_BUCKET_NAME

config = BceClientConfiguration(
    credentials=BceCredentials(access_key_id, secret_access_key), 
    endpoint = bos_endpoint
)

bos_client = BosClient(config)

async def upload_file_to_baidu_bos(file: UploadFile, folder: str) -> dict:
    file_size = file.size
    buf_size = 1024 * 10
    if not is_file_allowed(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size too large")

    md5 = hashlib.md5()
    try:
        while True:
            chunk = await file.read(buf_size)
            if not chunk:
                break
            md5.update(chunk)
    except Exception as e:
        print(f"Read file content failed: {e}")
        raise HTTPException(status_code=500, detail="Read file content failed")
    
    file.file.seek(0)
    content_md5 = base64.standard_b64encode(md5.digest())
    key = f"{folder}/{file.filename}"
    try:
        res = bos_client.put_object(
            bucket_name, 
            key, 
            file.file, 
            file_size, 
            content_md5, 
            content_type=file.content_type
        )
        print(res)
    except Exception as e:
        print(f"Upload file to baidu bos failed: {e}")
        raise e

    return {
        "key": key,
        "provider": "baidu",
        "content_type": file.content_type
    }



def get_baidu_bos_video_url(key: str) -> str:
    return bos_client.generate_pre_signed_url(bucket_name, key)


def get_baidu_bos_audio_url(key: str) -> str:
    return bos_client.generate_pre_signed_url(bucket_name, key)