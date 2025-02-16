import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile, HTTPException
from app.core.config import Config
import uuid
import mimetypes
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import logging

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Khởi tạo client S3 với các tùy chọn bổ sung
s3_client = boto3.client(
    's3',
    aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
    use_ssl=True,
    verify=True,  # Verify SSL certificates
    config=boto3.session.Config(retries={'max_attempts': 3, 'mode': 'standard'})
)

BUCKET_NAME = Config.AWS_S3_BUCKET_NAME
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mp3', 'wav', 'webm'}

def is_file_allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def requests_retry_session(
    retries=3,
    backoff_factor=0.3,
    status_forcelist=(500, 502, 504),
    session=None,
):
    session = session or requests.Session()
    retry = Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

async def upload_file_to_s3(file: UploadFile, folder: str) -> str:
    try:
        if not is_file_allowed(file.filename):
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed types are: {', '.join(ALLOWED_EXTENSIONS)}")
        
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File size exceeds the limit of {MAX_FILE_SIZE / (1024 * 1024)} MB")

        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_key = f"{folder}/{unique_filename}"
        
        content_type, _ = mimetypes.guess_type(file.filename)
        
        presigned_post = s3_client.generate_presigned_post(
            Bucket=BUCKET_NAME,
            Key=file_key,
            Fields={"Content-Type": content_type},
            Conditions=[
                ["content-length-range", 0, MAX_FILE_SIZE],
            ],
            ExpiresIn=3600
        )
        
        with file.file as data:
            files = {'file': (unique_filename, data)}
            response = requests_retry_session().post(presigned_post['url'], data=presigned_post['fields'], files=files)
        
        if response.status_code != 204:
            raise Exception(f"Failed to upload to S3. Status code: {response.status_code}")

        url = s3_client.generate_presigned_url('get_object',
                                                Params={'Bucket': BUCKET_NAME,
                                                        'Key': file_key},
                                                ExpiresIn=3600)
        
        logger.info(f"File uploaded successfully: {file_key}")
        return url

    except NoCredentialsError:
        logger.error("AWS credentials not available")
        raise HTTPException(status_code=500, detail="AWS credentials not available")
    except HTTPException as e:
        logger.error(f"HTTP exception: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"An error occurred while uploading to S3: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred while uploading to S3: {str(e)}")