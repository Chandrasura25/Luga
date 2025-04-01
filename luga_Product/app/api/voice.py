from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, BackgroundTasks
from fastapi.responses import FileResponse
from app.services.voice_service import ElevenLabsService
from app.db.database import database
from app.db.models import Audio, VoiceUploadResponse, DocumentResponse, TextToSpeechRequest, UserEmailRequest, UpdateAudioNameRequest, Voice
from bson import ObjectId
import docx
import PyPDF2
from fastapi import Form
import os
from app.services.cloudinary import upload_audio_to_cloudinary
from typing import List
from io import BytesIO


router = APIRouter()

AUDIO_FILES_DIR = "./audio_files"
os.makedirs(AUDIO_FILES_DIR, exist_ok=True) 

async def get_eleven_labs_service():
    return ElevenLabsService()

@router.get("/voices")
async def get_voices(service: ElevenLabsService = Depends()):
    """
    Lấy danh sách các giọng nói từ Eleven Labs API.
    """
    return service.get_voices()

@router.post("/notify-quota")
async def notify_quota(user_id: str, background_tasks: BackgroundTasks):
    """
    Check if a user's quota is running low and send a notification if needed.
    """
    user_quota = await database.db.users.find_one({"_id": user_id})
    if user_quota and user_quota["quota"]["audio_quota"] <= 60:  # Notify when less than 1 minute left
        background_tasks.add_task(send_notification, user_id, "You have less than 1 minute of audio quota left.")
    return {"message": "Notification checked and sent if applicable"}

async def send_notification(user_id: str, message: str):
    """
    Simulates sending a notification. This could be replaced with an email/SMS system.
    """
    print(f"Notification for user {user_id}: {message}")

@router.post("/text-to-speech", response_model=Audio)
async def text_to_speech(
    request: TextToSpeechRequest, 
    background_tasks: BackgroundTasks,
    service: ElevenLabsService = Depends(get_eleven_labs_service)
):
    try:
        # Fetch user data
        user = await database.find_user_by_email(request.user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check remaining quota
        remaining_quota = user.get("quota", {}).get("audio_quota", 0)
        if remaining_quota <= 0:
            raise HTTPException(status_code=403, detail="Insufficient quota, please upgrade your plan")

        if not request.text.strip():
            raise HTTPException(status_code=422, detail="Text cannot be empty")

        if not request.voice_id:
            raise HTTPException(status_code=422, detail="Voice ID is required")

        # Generate audio content
        audio_content = service.text_to_speech(request.voice_id, request.text)
        if not audio_content:
            raise HTTPException(status_code=500, detail="Failed to generate audio content")

        # Calculate actual duration (assuming 1 second per 3 words, modify as needed)
        words = len(request.text.split())
        estimated_duration = max(1, words // 3)  # Ensures minimum 1 second charge

        if estimated_duration > remaining_quota:
            raise HTTPException(status_code=403, detail="Not enough quota for this request")

        # Deduct used quota
        new_quota = max(0, remaining_quota - estimated_duration)
        await database.db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"quota.audio_quota": new_quota}}
        )

        # Notify if quota is running low
        if new_quota <= 60:  # Less than 1 minute remaining
            background_tasks.add_task(send_notification, user["_id"], "You have less than 1 minute of audio quota left.")

        # Upload audio file
        file_name = f"{user['_id']}_{request.voice_id}_{str(ObjectId())}.mp3"
        audio_url = await upload_audio_to_cloudinary(audio_content, "audio_files", file_name)

        # Store audio record
        audio_record = Audio(
            user_id=str(user["_id"]),
            voice_id=request.voice_id,
            audio_url=audio_url,
            file_name=file_name
        )
        await database.db.audio.insert_one(audio_record.dict())

        return audio_record

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-audio-name", response_model=Audio)
async def update_audio_name(request: UpdateAudioNameRequest):
    """
    Cập nhật tên của audio.
    """
    try:
        audio = await database.db.audio.find_one({"id": request.audio_id})
        if not audio:
            raise HTTPException(status_code=404, detail="Audio not found")
        await database.db.audio.update_one({"id": request.audio_id}, {"$set": {"file_name": request.new_name}})
        return audio
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user-voices", response_model=List[Audio])
async def get_user_voices(request: UserEmailRequest):
    """
    Lấy danh sách các giọng nói của user từ Eleven Labs API.
    """
    try:
        user = await database.find_user_by_email(request.email)
        voices = await database.db.audio.find({"user_id": str(user["_id"])}).to_list(None)
        return voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route phục vụ file audio từ server
@router.get("/{file_name}")
async def get_audio(file_name: str):
    """Serve audio file."""
    try:
        file_path = os.path.join(AUDIO_FILES_DIR, file_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")

        return FileResponse(
            file_path,
            media_type="audio/mpeg",
            headers={
                "Accept-Ranges": "bytes",
                "Content-Disposition": f"inline; filename={file_name}"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Route upload giọng nói
@router.post("/upload-voice/", response_model=VoiceUploadResponse)
async def upload_voice(
    user_email: str,
    file: UploadFile = File(None),
    voice_id: str = None,
    service: ElevenLabsService = Depends(get_eleven_labs_service)
):
    try:
        user = await database.find_user_by_email(user_email)
        if file and file.filename:  # Ensure file is provided and has a name
            if not file.content_type.startswith("audio/"):
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid file type. Please upload an audio file."
                )

            file_location = os.path.join(
                AUDIO_FILES_DIR, 
                f"{user['_id']}_{str(ObjectId())}.mp3"
            )
            
            try:
                with open(file_location, "wb") as buffer:
                    content = await file.read()
                    if not content:
                        raise HTTPException(
                            status_code=400, 
                            detail="Empty file uploaded"
                        )
                    buffer.write(content)
            except Exception as e:
                if os.path.exists(file_location):
                    os.remove(file_location)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to save file: {str(e)}"
                )

            voice_id = str(ObjectId())
            await database.db.voice.insert_one({
                "user_id": user['_id'],
                "voice_id": voice_id,
                "file_location": file_location
            })

            return VoiceUploadResponse(
                user_id=user['_id'],
                voice_id=voice_id,
                message="Voice file uploaded successfully."
            )

        elif voice_id:  # Check if voice_id is provided when file is not
            if not await service.validate_voice(voice_id):
                raise HTTPException(status_code=400, detail="Invalid voice ID.")

            await database.db.voice.update_one(
                {"user_id": user['_id']},
                {"$set": {"voice_id": voice_id}},
                upsert=True
            )

            return VoiceUploadResponse(
                user_id=user['_id'],
                voice_id=voice_id,
                message="Preselected voice set successfully."
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Please either upload a voice file or provide a valid voice_id."
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-document", response_model=DocumentResponse)
async def upload_document(user_email: str = Form(...), file: UploadFile = File(...)):
    """
    Upload a document (.docx, .txt, or .pdf) and extract text from it.
    The extracted text can then be used for TTS.
    """
    user = await database.find_user_by_email(user_email)
    try:
        file_content = await file.read()  # Read the file content into memory
        file_stream = BytesIO(file_content)  # Wrap it in a BytesIO buffer

        if file.content_type == "text/plain":
            text = file_content.decode("utf-8")

        elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            doc = docx.Document(file_stream)  # Pass the BytesIO object
            text = "\n".join([para.text for para in doc.paragraphs])

        elif file.content_type == "application/pdf":
            reader = PyPDF2.PdfReader(file_stream)  # Pass the BytesIO object
            text = "".join([page.extract_text() or "" for page in reader.pages])

            if not text:
                raise HTTPException(status_code=400, detail="Could not extract text from the PDF file.")

        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a .docx, .txt, or .pdf file.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while processing the file: {str(e)}")

    return DocumentResponse(user_id=str(user['_id']), text=text)

@router.post("/clone-voice")
async def clone_voice(
    user_email: str = Form(...),
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    service: ElevenLabsService = Depends(get_eleven_labs_service)
):
    """
    Clone a voice from an audio file.
    """
    try:
        # Validate file type
        if not file.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an audio file."
            )

        # Get user
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Read file content
        file_content = await file.read()
        
        # Clone voice using ElevenLabs API
        cloned_voice = service.clone_voice(
            name=name,
            description=description,
            audio_file=file_content
        )

        # Store voice information in database
        voice_record = {
            "user_id": str(user["_id"]),
            "voice_id": cloned_voice["voice_id"],
            "name": name,
            "description": description,
            "is_cloned": True
        }
        
        await database.db.voice.insert_one(voice_record)

        return {
            "status": "success",
            "voice_id": cloned_voice["voice_id"],
            "message": "Voice cloned successfully"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cloned-voices", response_model=List[Voice])
async def get_clone_voice(request: UserEmailRequest):
    """
    Get all cloned voices for a user.
    """
    try:
        user = await database.find_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Use to_list() to convert the cursor to a list
        cloned_voices_cursor = database.db.voice.find({"user_id": str(user["_id"])})
        cloned_voices = await cloned_voices_cursor.to_list(length=None)
        
        return cloned_voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
