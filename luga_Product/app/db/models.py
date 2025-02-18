from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from app.db.database import database

class SubscriptionRequest(BaseModel):
    email: str
    name: str
    priceId: str
  
class UpdateAudioNameRequest(BaseModel):
    audio_id: str
    new_name: str

class User(BaseModel):
    email: str
    password: str
    username:str

class UserEmailRequest(BaseModel):
    email: str

class TokenLogOut(BaseModel):
    token: str

class Audio(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))  
    user_id: str
    voice_id: str
    audio_url: str
    file_name: str

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

class VoiceUploadResponse(BaseModel):
    user_id: str
    voice_id: str
    message: str

class DocumentResponse(BaseModel):
    user_id: str
    text: str

class TextToSpeechRequest(BaseModel):
    user_email: str
    voice_id: str
    text: str

class AudioUploadResponse(BaseModel):
    user_id: str
    audio_id: str
    audio_url: str
    message: str

class VideoUploadResponse(BaseModel):
    user_id: str
    video_id: str
    video_url: str  
    message: str

class VideoProcessedResponse(BaseModel):
    user_id: str
    video_id: str
    sync_result: Dict[str, Any] = Field(..., description="Full response from SyncLabs API v2")
    message: str

class SyncAudioRequest(BaseModel):
    audio_id: str
    user_id: str
    video_id: str
    model: str = "lipsync-1.7.1"  
    output_format: str = "mp4"  
    webhook_url: Optional[str] = None

class JobStatusResponse(BaseModel):
    user_id: str
    video_id: str
    status: str
    result_video_url: Optional[str]
    job_result: Optional[dict]
    created_at: datetime
    updated_at: datetime

class AudioToVideo(BaseModel):
    user_id: str
    video_id: str
    audio_id: str 
    audio_url: str
    video_url: str
    job_id: str  
    status: str  
    sync_result: Dict[str, Any] = Field(..., description="Full response from SyncLabs API v2")
    created_at: datetime
    updated_at: Optional[datetime] = None  

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Text(BaseModel):
    prompt: str
    response: str
    timestamp: datetime = datetime.utcnow()

class TextCreate(BaseModel):
    prompt: str
    user_email: str
class TextResponse(BaseModel):
    prompt: str
    response: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

