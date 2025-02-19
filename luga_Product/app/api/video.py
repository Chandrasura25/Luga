from fastapi import APIRouter, UploadFile, HTTPException, File, Form, Request
from fastapi.responses import JSONResponse, Response
from typing import Dict, Optional
from bson import ObjectId
from datetime import datetime
from app.services.video_service import SyncLabsVideoService
from app.db.models import AudioToVideo, VideoUploadResponse, VideoProcessedResponse, JobStatusResponse, SyncAudioRequest, AudioUploadResponse
from app.db.database import database
from app.services.cloudinary import upload_file_to_cloudinary, get_cloudinary_video_url,get_cloudinary_audio_url
from app.services.baidu import upload_file_to_baidu_bos, get_baidu_bos_video_url, get_baidu_bos_audio_url
router = APIRouter()

from app.core.config import Config
video_service = SyncLabsVideoService(api_key=Config.SYNCLABS_API_KEY)

from PIL import Image, ImageDraw
import io
@router.get("/api/placeholder/{width}/{height}")
async def get_placeholder_image(width: int, height: int):
    image = Image.new('RGB', (width, height), color='#E5E7EB')
    draw = ImageDraw.Draw(image)
    text = "Preview Area"
    x = width/2
    y = height/2
    draw.text((x, y), text, fill='#6B7280', anchor="mm")
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()

    return Response(content=img_byte_arr, media_type="image/png")

@router.post("/upload-audio", response_model=AudioUploadResponse)
async def upload_audio(
    audio: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

        audio_upload_result = {}
        if Config.S3_PROVIDER == "BAIDU":
            audio_upload_result = await upload_file_to_baidu_bos(audio, folder="audios")
        else:
            audio_upload_result = await upload_file_to_cloudinary(audio, folder="audios")
        
        audio_id = str(ObjectId())
        audio_record = {
            "user_id": user_id,
            "audio_id": audio_id,
            # "public_id": audio_upload_result['public_id'],
            # "format": audio_upload_result['format'],
            # "resource_type": audio_upload_result['resource_type'],
            "created_at": datetime.utcnow(),
        }
        audio_record.update(audio_upload_result)

        await database.db.audios.insert_one(audio_record)

        audio_url = None
        if Config.S3_PROVIDER == "BAIDU":
            audio_url = get_baidu_bos_audio_url(audio_record['key'])
        else:
            audio_url = get_cloudinary_audio_url(
                audio_upload_result['public_id'],
                audio_upload_result['resource_type'],
                audio_upload_result['format']
            )

        return AudioUploadResponse(
            user_id=user_id,
            audio_id=audio_id,
            audio_url=audio_url,
            message="Audio uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-video/", response_model=VideoUploadResponse)
async def upload_video(
    video: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

        video_upload_result = {}
        if Config.S3_PROVIDER == "BAIDU":
            video_upload_result = await upload_file_to_baidu_bos(video, folder="videos")
        else:
            video_upload_result = await upload_file_to_cloudinary(video, folder="videos")
        
        video_id = str(ObjectId())
        video_record = {
            "user_id": user_id,
            "video_id": video_id,
            # "public_id": upload_result['public_id'],
            # "format": upload_result['format'],
            # "resource_type": upload_result['resource_type'],
            "created_at": datetime.utcnow(),
        }
        video_record.update(video_upload_result)

        await database.db.videos.insert_one(video_record)

        video_url = None
        if Config.S3_PROVIDER == "BAIDU":
            video_url = get_baidu_bos_video_url(video_record['key'])
        else:
            video_url = get_cloudinary_video_url(
                video_record['public_id'], 
                video_record['resource_type'], 
                video_record['format']
            )

        return VideoUploadResponse(
            user_id=user_id,
            video_id=video_id,
            video_url=video_url,
            message="Video uploaded successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sync-audio/", response_model=VideoProcessedResponse)
async def sync_audio(request: SyncAudioRequest):
    video_record = await database.db.videos.find_one({
        "user_id": request.user_id, 
        "video_id": request.video_id
    })
    
    if not video_record:
        raise HTTPException(status_code=404, detail="No video found for this user and video ID")

    audio_record = await database.db.audios.find_one({
        "user_id": request.user_id,
        "audio_id": request.audio_id
    })

    if not audio_record:
        raise HTTPException(status_code=404, detail="No audio found for this user and audio ID")

    try:
        video_url = None
        if Config.S3_PROVIDER == "BAIDU":
            video_url = get_baidu_bos_video_url(video_record['key'])
        else:
            video_url = get_cloudinary_video_url(
                video_record['public_id'], 
                video_record['resource_type'], 
                video_record['format']
            )
        if not video_url:
            raise HTTPException(status_code=500, detail="Failed to get video URL")
        
        audio_url = None
        if Config.S3_PROVIDER == "BAIDU":
            audio_url = get_baidu_bos_audio_url(audio_record['key'])
        else:
            audio_url = get_cloudinary_audio_url(
                audio_record['public_id'],
                audio_record['resource_type'],
                audio_record['format']
            )
        if not audio_url:
            raise HTTPException(status_code=500, detail="Failed to get audio URL")

        sync_result = video_service.sync_audio_with_video(
            audio_url=audio_url,
            video_url=video_url,
            model=request.model,
            webhook_url=request.webhook_url
        )

        sync_record = {
            "user_id": request.user_id,
            "video_id": request.video_id,
            "audio_id": request.audio_id,
            "job_id": sync_result.get("id"),
            "status": sync_result.get("status", "processing"),
            "sync_result": sync_result,
            "audio_url": audio_url,
            "video_url": video_url,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await database.db.audio_to_video.insert_one(sync_record)

        return VideoProcessedResponse(
            user_id=request.user_id,
            video_id=request.video_id,
            sync_result=sync_result,
            message="Audio sync job submitted successfully"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/job/{user_id}/{video_id}", response_model=JobStatusResponse)
async def get_job_status(user_id: str, video_id: str):
    try:
        sync_record = await database.db.audio_to_video.find_one(
            {"user_id": user_id, "video_id": video_id},
            sort=[("created_at", -1)]
        )
        
        if not sync_record:
            raise HTTPException(
                status_code=404, 
                detail="No sync record found for this user and video ID"
            )
        
        job_id = sync_record.get("job_id")
        if not job_id:
            raise HTTPException(
                status_code=400, 
                detail="No job ID found for this sync record"
            )

        job_status = video_service.get_job_status(job_id)
        
        update_data = {
            "status": job_status.get("status"),
            "job_result": job_status,
            "updated_at": datetime.utcnow()
        }

        if job_status.get("status") == "completed":
            result_url = job_status.get("output", {}).get("url") or job_status.get("result", {}).get("url")
            if result_url:
                update_data["result_video_url"] = result_url

        await database.db.audio_to_video.update_one(
            {"_id": sync_record["_id"]},
            {"$set": update_data}
        )

        response_data = {
            "user_id": user_id,
            "video_id": video_id,
            "status": job_status.get("status"),
            "result_video_url": update_data.get("result_video_url"),
            "job_result": job_status,
            "created_at": sync_record.get("created_at"),
            "updated_at": datetime.utcnow()
        }

        return JobStatusResponse(**response_data)

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while checking job status: {str(e)}"
        )

@router.get("/jobs/{user_id}", response_model=list[JobStatusResponse])
async def get_user_jobs(user_id: str, limit: int = 10, skip: int = 0):
    try:
        cursor = database.db.audio_to_video.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        jobs = []
        async for record in cursor:
            job_data = {
                "user_id": record["user_id"],
                "video_id": record["video_id"],
                "status": record.get("status"),
                "result_video_url": record.get("result_video_url"),
                "job_result": record.get("job_result"),
                "created_at": record.get("created_at"),
                "updated_at": record.get("updated_at", record.get("created_at"))
            }
            jobs.append(JobStatusResponse(**job_data))
            
        return jobs

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching user jobs: {str(e)}"
        )

@router.delete("/job/{user_id}/{video_id}")
async def delete_job(user_id: str, video_id: str):
    try:
        result = await database.db.audio_to_video.delete_one(
            {"user_id": user_id, "video_id": video_id}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No job found with the specified user ID and video ID"
            )
            
        await database.db.videos.delete_one(
            {"user_id": user_id, "video_id": video_id}
        )
        
        return {"message": "Job deleted successfully"}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the job: {str(e)}"
        )