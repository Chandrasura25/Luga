from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TextCreate(BaseModel):
    prompt: str
    user_email: str

class TextResponse(BaseModel):
    prompt: str
    response: str
    timestamp: Optional[str] = None
    date: Optional[str] = None
    conversation_id: Optional[str] = None
    title: Optional[str] = None
    warning: Optional[str] = None

class ConversationCreate(BaseModel):
    prompt: str
    user_email: str
    conversation_id: Optional[str] = None
    title: Optional[str] = None

class Message(BaseModel):
    prompt: str
    response: str
    timestamp: str

class ConversationResponse(BaseModel):
    conversation_id: str
    title: str
    messages: List[Message] 
    timestamp: str