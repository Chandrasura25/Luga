from fastapi import APIRouter, UploadFile, HTTPException, File, Form, Request, Body
from fastapi.responses import JSONResponse, Response
from typing import Dict, Optional
from bson import ObjectId
from datetime import datetime
from app.services.video_service import SyncLabsVideoService, get_video_duration
from app.db.models import AudioToVideo, VideoUploadResponse, VideoProcessedResponse, JobStatusResponse, SyncAudioRequest, AudioUploadResponse
from app.db.database import database
from app.services.cloudinary import upload_file_to_cloudinary, get_cloudinary_video_url,get_cloudinary_audio_url
from app.services.baidu import upload_file_to_baidu_bos, get_baidu_bos_video_url, get_baidu_bos_audio_url
from pymongo import DESCENDING
from typing import List
import tempfile
import os
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
    user_email: str = Form(...)
):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

        audio_upload_result = {}
        if Config.S3_PROVIDER == "BAIDU":
            audio_upload_result = await upload_file_to_baidu_bos(audio, folder="audios")
        else:
            audio_upload_result = await upload_file_to_cloudinary(audio, folder="audios")
        
        audio_id = str(ObjectId())
        audio_url = None
        if Config.S3_PROVIDER == "BAIDU":
            audio_url = get_baidu_bos_audio_url(audio_upload_result['key'])
        else:
            audio_url = get_cloudinary_audio_url(
                audio_upload_result['public_id'],
                audio_upload_result['resource_type'],
                audio_upload_result['format']
            )
        audio_record = {
            "user_id": str(user["_id"]),
            "audio_id": audio_id,
            "audio_url": audio_url,
            "file_name": audio.filename,  # Save the file name to the database
            "created_at": datetime.utcnow(),
        }
        audio_record.update(audio_upload_result)

        await database.db.audios.insert_one(audio_record)

        return AudioUploadResponse(
            user_id=str(user["_id"]),
            audio_id=audio_id,
            audio_url=audio_url,
            file_name=audio.filename,  # Ensure file_name is included in the response
            message="Audio uploaded successfully"
        )
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    # fetch audio from db
@router.post("/get-audio", response_model=List[AudioUploadResponse])
async def get_audio(user_email: str = Body(..., embed=True)): 
    user = await database.find_user_by_email(user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    audio = await database.db.audios.find({"user_id": str(user["_id"])}).sort("created_at", DESCENDING).to_list(100)
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")
    return [
        AudioUploadResponse(
            user_id=str(user["_id"]),
            audio_id=item["audio_id"],
            audio_url=item.get("audio_url", ""),
            file_name=item.get("file_name", "No file name"),
            message="Audio fetched successfully"
        ) for item in audio
    ]
@router.post("/upload-video", response_model=VideoUploadResponse)
async def upload_video(
    video: UploadFile = File(...),
    user_email: str = Form(...)
):
    try:
        if not video.content_type.startswith('video/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check remaining video quota
        remaining_video_quota = user.get("quota", {}).get("video_quota", 0)
        if remaining_video_quota <= 0:
            raise HTTPException(status_code=403, detail="Insufficient video quota. Please upgrade your plan.")

        # Save video temporarily for both upload & duration extraction
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
            temp_video.write(await video.read())
            temp_video_path = temp_video.name

        # Reset video file pointer
        await video.seek(0)

        # Upload video to cloud storage (Cloudinary or Baidu BOS)
        video_upload_result = {}
        if Config.S3_PROVIDER == "BAIDU":
            video_upload_result = await upload_file_to_baidu_bos(video, folder="videos")
        else:
            video_upload_result = await upload_file_to_cloudinary(video, folder="videos")

        # Ensure public_id is valid (Cloudinary)
        if 'public_id' in video_upload_result:
            video_upload_result['public_id'] = video_upload_result['public_id'].strip()
            if not video_upload_result['public_id']:
                raise HTTPException(status_code=500, detail="Cloudinary upload error: Invalid public_id after stripping whitespace.")

        print(video_upload_result, "video_upload_result")

        # Extract actual video duration
        actual_duration = await get_video_duration(temp_video_path)

        # Remove temporary file after extracting duration
        os.unlink(temp_video_path)

        # Check if the video duration exceeds the remaining quota
        if actual_duration > remaining_video_quota:
            raise HTTPException(status_code=403, detail="Not enough video quota for this upload.")

        # Deduct used video quota
        new_video_quota = max(0, remaining_video_quota - actual_duration)
        await database.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"quota.video_quota": new_video_quota}}
        )

        # Generate video ID and construct video record
        video_id = str(ObjectId())
        video_record = {
            "user_id": str(user["_id"]),
            "video_id": video_id,
            "file_name": video.filename,
            "duration": actual_duration,  # Save actual duration
            "created_at": datetime.utcnow(),
        }
        video_record.update(video_upload_result)  # Merge with upload details

        # Store video record in the database
        await database.db.videos.insert_one(video_record)

        # Generate video URL
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
            user_id=str(user["_id"]),
            video_id=video_id,
            video_url=video_url,
            file_name=video.filename,
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

# @router.post("/upload-video", response_model=VideoUploadResponse)
# async def upload_video(
#     video: UploadFile = File(...),
#     user_email: str = Form(...)
# ):
#     try:
#         user = await database.find_user_by_email(user_email)
#         if not user:
#             raise HTTPException(status_code=404, detail="User not found")

#         # Check remaining video quota
#         remaining_video_quota = user.get("quota", {}).get("video_quota", 0)
#         if remaining_video_quota <= 0:
#             raise HTTPException(status_code=403, detail="Insufficient video quota. Please upgrade your plan.")

#         if not video.content_type.startswith('video/'):
#             raise HTTPException(status_code=400, detail="Invalid file type. Please upload a video file.")

#         # Save video temporarily to extract duration
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
#             temp_video.write(await video.read())
#             temp_video_path = temp_video.name

#         # Extract actual video duration
#         try:
#             clip = VideoFileClip(temp_video_path)
#             actual_duration = clip.duration  # Duration in seconds
#             clip.close()
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Error extracting video duration: {str(e)}")

#         # Remove temporary file
#         os.unlink(temp_video_path)

#         if actual_duration > remaining_video_quota:
#             raise HTTPException(status_code=403, detail="Not enough video quota for this upload.")

#         # Deduct used video quota
#         new_video_quota = max(0, remaining_video_quota - actual_duration)
#         await database.db.users.update_one(
#             {"_id": user["_id"]},
#             {"$set": {"quota.video_quota": new_video_quota}}
#         )

#         # Upload video file
#         video_upload_result = await upload_file_to_cloudinary(video, folder="videos")
#         video_id = str(ObjectId())
#         video_url = get_cloudinary_video_url(
#             video_upload_result['public_id'],
#             video_upload_result['resource_type'],
#             video_upload_result['format']
#         )

#         video_record = {
#             "user_id": str(user["_id"]),
#             "video_id": video_id,
#             "video_url": video_url,
#             "file_name": video.filename,
#             "duration": actual_duration,  # Save actual duration
#             "created_at": datetime.utcnow(),
#         }
#         video_record.update(video_upload_result)

#         await database.db.videos.insert_one(video_record)

#         return VideoUploadResponse(
#             user_id=str(user["_id"]),
#             video_id=video_id,
#             video_url=video_url,
#             file_name=video.filename,
#             message=f"Video uploaded successfully. Duration: {actual_duration} seconds"
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-video", response_model=List[VideoUploadResponse])
async def get_video(user_email: str = Body(..., embed=True)): 
    user = await database.find_user_by_email(user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    video = await database.db.videos.find({"user_id": str(user["_id"])}).sort("created_at", DESCENDING).to_list(100)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return [
        VideoUploadResponse(
            user_id=str(user["_id"]),
            video_id=item["video_id"],
            video_url=item.get("video_url", ""),
            file_name=item.get("file_name", ""),
            message="Video fetched successfully"
        ) for item in video
    ]

@router.post("/sync-audio", response_model=VideoProcessedResponse)
async def sync_audio(request: SyncAudioRequest):
    user = await database.find_user_by_email(request.user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get process video quota
    process_quota = user.get("quota", {}).get("process_video_quota", 0)

    # Count currently active processes (PENDING or PROCESSING)
    active_processes = await database.db.audio_to_video.count_documents({
        "user_id": str(user["_id"]),
        "status": {"$in": ["PENDING", "PROCESSING"]}
    })

    if active_processes >= process_quota:
        raise HTTPException(status_code=403, detail="Concurrent video processing limit reached. Please wait for ongoing processes to complete.")

    video_record = await database.db.videos.find_one({
        "user_id": str(user["_id"]),
        "video_id": request.video_id
    })

    if not video_record:
        raise HTTPException(status_code=404, detail="No video found for this user and video ID")

    audio_record = await database.db.audios.find_one({
        "user_id": str(user["_id"]),
        "audio_id": request.audio_id
    })

    if not audio_record:
        raise HTTPException(status_code=404, detail="No audio found for this user and audio ID")

    try:
        # Fetch video and audio URLs
        video_url = get_baidu_bos_video_url(video_record['key']) if Config.S3_PROVIDER == "BAIDU" else get_cloudinary_video_url(
            video_record['public_id'], 
            video_record['resource_type'], 
            video_record['format']
        )

        if not video_url:
            raise HTTPException(status_code=500, detail="Failed to get video URL")

        audio_url = get_baidu_bos_audio_url(audio_record['key']) if Config.S3_PROVIDER == "BAIDU" else get_cloudinary_audio_url(
            audio_record['public_id'],
            audio_record['resource_type'],
            audio_record['format']
        )

        if not audio_url:
            raise HTTPException(status_code=500, detail="Failed to get audio URL")

        sync_result = video_service.sync_audio_with_video(
            audio_url=audio_url,
            video_url=video_url,
        )

        if not sync_result:
            raise HTTPException(status_code=500, detail="Failed to sync audio")

        # Store sync job details
        sync_record = {
            "user_id": str(user["_id"]),
            "video_id": request.video_id,
            "audio_id": request.audio_id,
            "job_id": sync_result.get("id"),
            "status": sync_result.get("status", "PENDING"),  # Ensure the initial status is 'PENDING'
            "sync_result": sync_result,
            "audio_url": audio_url,
            "video_url": video_url,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        await database.db.audio_to_video.insert_one(sync_record)

        return VideoProcessedResponse(
            user_id=str(user["_id"]),
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
        if job_status.get("status") == "COMPLETED":
            result_url = job_status.get("output", {}).get("url") or job_status.get("result", {}).get("url")
            if result_url:
                update_data["result_video_url"] = result_url

        # Ensure the database is updated with the latest job status
        update_result = await database.db.audio_to_video.find_one_and_update(
            {"user_id": user_id, "video_id": video_id},
            {"$set": update_data}
        )
        print(update_result)
        if not update_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to update the sync record in the database"
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

@router.get("/jobs/{user_email}", response_model=list[JobStatusResponse])
async def get_user_jobs(user_email: str, limit: int = 10, skip: int = 0):
    try:
        user = await database.find_user_by_email(user_email)    
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        cursor = database.db.audio_to_video.find(
            {"user_id": str(user["_id"])}
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