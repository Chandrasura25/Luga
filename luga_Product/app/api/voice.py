from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import FileResponse
from app.services.voice_service import ElevenLabsService
from app.db.database import database
from app.db.models import Audio, VoiceUploadResponse, DocumentResponse, TextToSpeechRequest
from bson import ObjectId
from io import StringIO
import docx
import PyPDF2
import os

router = APIRouter()

AUDIO_FILES_DIR = "./audio_files"
os.makedirs(AUDIO_FILES_DIR, exist_ok=True) 

async def get_eleven_labs_service():
    return ElevenLabsService()

@router.get("/voices/")
async def get_voices(service: ElevenLabsService = Depends()):
    """
    Lấy danh sách các giọng nói từ Eleven Labs API.
    """
    return service.get_voices()

@router.post("/text-to-speech/", response_model=Audio)
async def text_to_speech(
    request: TextToSpeechRequest, 
    service: ElevenLabsService = Depends(get_eleven_labs_service)
):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=422, detail="Text cannot be empty")

        if not request.voice_id:
            raise HTTPException(status_code=422, detail="Voice ID is required")

        audio_content = service.text_to_speech(request.voice_id, request.text)
        
        # Thêm kiểm tra audio_content
        if not audio_content:
            raise HTTPException(status_code=500, detail="Failed to generate audio content")

        file_name = f"{request.user_id}_{request.voice_id}_{str(ObjectId())}.mp3"
        file_path = os.path.join(AUDIO_FILES_DIR, file_name)

        with open(file_path, "wb") as f:
            f.write(audio_content)

        audio_record = Audio(
            user_id=request.user_id,
            voice_id=request.voice_id,
            audio_url=file_name,  # Removed leading slash
        )
        await database.db.audio.insert_one(audio_record.dict())
        return audio_record

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_voices(service: ElevenLabsService = Depends()):
    """
    Lấy danh sách các giọng nói từ Eleven Labs API.
    """
    return service.get_voices()

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
    user_id: str,
    file: UploadFile = File(None),
    voice_id: str = None,
    service: ElevenLabsService = Depends(get_eleven_labs_service)
):
    try:
        if file and file.filename:  # Ensure file is provided and has a name
            if not file.content_type.startswith("audio/"):
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid file type. Please upload an audio file."
                )

            file_location = os.path.join(
                AUDIO_FILES_DIR, 
                f"{user_id}_{str(ObjectId())}.mp3"
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
                "user_id": user_id,
                "voice_id": voice_id,
                "file_location": file_location
            })

            return VoiceUploadResponse(
                user_id=user_id,
                voice_id=voice_id,
                message="Voice file uploaded successfully."
            )

        elif voice_id:  # Check if voice_id is provided when file is not
            if not await service.validate_voice(voice_id):
                raise HTTPException(status_code=400, detail="Invalid voice ID.")

            await database.db.voice.update_one(
                {"user_id": user_id},
                {"$set": {"voice_id": voice_id}},
                upsert=True
            )

            return VoiceUploadResponse(
                user_id=user_id,
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


# Route upload document và trích xuất text
@router.post("/upload-document/", response_model=DocumentResponse)
async def upload_document(user_id: str, file: UploadFile = File(...)):
    """
    Upload a document (.docx, .txt, or .pdf) and extract text from it.
    The extracted text can then be used for TTS.
    """
    if file.content_type == "text/plain":
        content = await file.read()
        text = content.decode("utf-8")

    elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = docx.Document(file.file)
        text = "\n".join([para.text for para in doc.paragraphs])

    elif file.content_type == "application/pdf":
        reader = PyPDF2.PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF file.")

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a .docx, .txt, or .pdf file.")

    return DocumentResponse(user_id=user_id, text=text)
