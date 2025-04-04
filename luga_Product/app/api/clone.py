from fastapi import APIRouter, HTTPException, UploadFile, File, Query
import requests
import os
from dotenv import load_dotenv
from fastapi.responses import FileResponse
from werkzeug.utils import secure_filename
from app.core.config import Config
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
# Configure these variables
ELEVENLABS_API_KEY =  Config.ELEVEN_LABS_API_KEY # Replace with your actual API key
ELEVENLABS_VOICE_CLONE_URL = "https://api.elevenlabs.io/v1/voices/add"
ELEVENLABS_TEXT_TO_SPEECH_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

class PreviewRequest(BaseModel):
    voice_id: str
    text: str = "Hello, this is a preview of your cloned voice."

@router.post('/clone-voice')
async def clone_voice(files: list[UploadFile] = File(...), voice_name: str = 'Cloned Voice', description: str = ''):
    temp_files = []  # Keep track of created temporary files
    opened_files = []  # Keep track of opened file handles
    
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Validate file types
        for file in files:
            if not file.content_type.startswith('audio/'):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type: {file.content_type}. Only audio files are allowed."
                )
        
        # Save files temporarily
        file_paths = []
        for file in files:
            if file.filename == '':
                continue
            file_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
            with open(file_path, 'wb') as f:
                content = await file.read()
                f.write(content)
            file_paths.append(file_path)
            temp_files.append(file_path)  # Add to tracking list
        
        if not file_paths:
            raise HTTPException(status_code=400, detail="No valid files provided")
        
        # Prepare request to ElevenLabs
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "accept": "application/json"
        }
        
        data = {
            'name': voice_name,
            'description': description,
            'labels': {}  # Optional labels can be added here
        }
        
        # Open files for upload
        files_to_upload = []
        for file_path in file_paths:
            f = open(file_path, 'rb')
            opened_files.append(f)  # Track opened files
            files_to_upload.append(('files', f))
        
        # Send to ElevenLabs
        response = requests.post(
            ELEVENLABS_VOICE_CLONE_URL,
            headers=headers,
            data=data,
            files=files_to_upload
        )
        
        # Handle different error scenarios
        if response.status_code != 200:
            error_detail = "Unknown error"
            try:
                error_json = response.json()
                if isinstance(error_json, dict):
                    error_detail = error_json.get('detail', {}).get('message', error_json.get('detail', 'Unknown error'))
                elif isinstance(error_json, str):
                    error_detail = error_json
            except Exception:
                # If JSON parsing fails, try to get raw text
                error_detail = response.text or "Unknown error"
            
            print(f"ElevenLabs API Error - Status Code: {response.status_code}, Response: {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Voice cloning failed: {error_detail}"
            )
        
        try:
            voice_data = response.json()
            # Validate the response contains required fields
            if 'voice_id' not in voice_data:
                raise HTTPException(
                    status_code=500,
                    detail="Invalid response from ElevenLabs API: missing voice_id"
                )
            return voice_data
        except ValueError:
            raise HTTPException(
                status_code=500,
                detail="Invalid JSON response from ElevenLabs API"
            )
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions as is
    except Exception as e:
        print(f"Unexpected error in clone_voice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
    
    finally:
        # Close all opened file handles
        for f in opened_files:
            try:
                f.close()
            except:
                pass
        
        # Clean up temp files
        for file_path in temp_files:
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Failed to remove temporary file {file_path}: {str(e)}")

@router.post('/generate-preview')
async def generate_preview(request: PreviewRequest):
    try:
        if not request.voice_id:
            raise HTTPException(status_code=400, detail="Voice ID is required")
        
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "accept": "audio/mpeg",
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": request.text,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        url = ELEVENLABS_TEXT_TO_SPEECH_URL.format(voice_id=request.voice_id)
        response = requests.post(url, json=payload, headers=headers)
        print(response.json())
        if response.status_code == 429:  # Quota exceeded
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "quota_exceeded",
                    "detail": response.json().get('detail', {}),
                    "message": "You don't have enough credits to generate this preview"
                }
            )
        
        if response.status_code != 200:
            error_detail = "Unknown error"
            try:
                error_json = response.json()
                error_detail = error_json.get('detail', error_json.get('message', 'Unknown error'))
            except:
                error_detail = response.text or "Unknown error"
            
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Preview generation failed: {error_detail}"
            )
        
        # Save the audio file temporarily (or stream it directly)
        preview_path = os.path.join(UPLOAD_FOLDER, f"preview_{request.voice_id}.mp3")
        with open(preview_path, 'wb') as f:
            f.write(response.content)
        
        return {
            "preview_url": f"/preview-audio/{request.voice_id}",
            "message": "Preview generated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in generate_preview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get('/preview-audio/{voice_id}')
async def get_preview_audio(voice_id: str):
    preview_path = os.path.join(UPLOAD_FOLDER, f"preview_{voice_id}.mp3")
    if not os.path.exists(preview_path):
        raise HTTPException(status_code=404, detail="Preview not found")
    
    return FileResponse(preview_path, media_type='audio/mpeg')

