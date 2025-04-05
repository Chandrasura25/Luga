from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional, Dict, Any, List
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
    username: Optional[str] = None
    profile_image: Optional[str] = None
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None
    invitation_code: Optional[str] = None
    used_audio_time: float = 0.0  
    used_video_time: float = 0.0  
    used_process_videos: int = 0  # Active processing videos count
    used_text_characters: int = 0  # Track text generation characters
    verified: bool = False
    verification_token: Optional[str] = None
    password_reset_code: Optional[str] = None
    subscription_status: str = "inactive"
    subscription_plan: str = "Demo"
    subscription_expiry: Optional[datetime] = None
    quota: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

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
    file_name: str
    message: str

class VideoUploadResponse(BaseModel):
    user_id: str
    video_id: str
    video_url: str  
    file_name: str
    message: str

class VideoProcessedResponse(BaseModel):
    user_id: str
    video_id: str
    sync_result: Dict[str, Any] = Field(..., description="Full response from SyncLabs API v2")
    message: str

class SyncAudioRequest(BaseModel):
    audio_id: str
    user_email: str
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
    level: str
    conversation_id: Optional[str] = None
    title: Optional[str] = None
    warning: Optional[str] = None

class Message(BaseModel):
    prompt: str
    response: str
    timestamp: str
    conversation_id: str

class ConversationCreate(BaseModel):
    prompt: str
    user_email: str
    conversation_id: Optional[str] = None
    title: Optional[str] = None
    level: Optional[str] = None

class ConversationResponse(BaseModel):
    conversation_id: str
    title: str
    messages: List[Message]
    timestamp: str
    warning: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ConversationSummary(BaseModel):
    conversation_id: str
    title: str
    created_at: str
    updated_at: str

class TextResponse(BaseModel):
    prompt: str
    response: str
    conversation_id: Optional[str] = None
    timestamp: Optional[str] = None
    title: Optional[str] = None
    warning: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class Voice(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    voice_id: str
    name: str
    description: str
    is_cloned: bool = True
    preview_url: Optional[str] = None
    labels: Optional[Dict[str, str]] = None
    category: Optional[str] = None
    available_for_tiers: Optional[List[str]] = None
    settings: Optional[Dict[str, Any]] = None
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}

