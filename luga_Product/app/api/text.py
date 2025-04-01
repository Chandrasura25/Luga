from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional
from app.db.models import TextCreate, TextResponse, ConversationCreate, ConversationResponse
from app.services.text_service import generate_response, generate_response_deepseek, generate_response_grok
from app.db.database import database
from pymongo import DESCENDING
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/generate", response_model=ConversationResponse)
async def create_prompt(prompt: TextCreate):
    user = await database.find_user_by_email(prompt.user_email)
    if not user or user.get("quota", {}).get("text_quota", 0) == 0:
        raise HTTPException(status_code=403, detail="Insufficient quota, please upgrade your plan")

    try:
        timestamp = datetime.utcnow()
        title = None
        
        # Generate response based on user's level
        if prompt.level.lower() == "openai":
            response_text = await generate_response(prompt.prompt)
            if not prompt.conversation_id:  # Generate title for new conversation
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{prompt.prompt}"
                title = await generate_response(title_prompt)
                title = title.strip().strip('"\'').strip()
        elif prompt.level.lower() == "deepseek":
            response_text = await generate_response_deepseek(prompt.prompt)
            if not prompt.conversation_id:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{prompt.prompt}"
                title = await generate_response_deepseek(title_prompt)
                title = title.strip().strip('"\'').strip()
        elif prompt.level.lower() == "grok":
            response_text = await generate_response_grok(prompt.prompt)
            if not prompt.conversation_id:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{prompt.prompt}"
                title = await generate_response_grok(title_prompt)
                title = title.strip().strip('"\'').strip()
        else:
            raise HTTPException(status_code=400, detail="Invalid level")

        # Handle conversation
        if prompt.conversation_id:
            # Continue existing conversation
            existing_conv = await database.get_conversation(prompt.conversation_id, str(user["_id"]))
            if not existing_conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
            conversation_id = prompt.conversation_id
        else:
            # Create new conversation
            conversation_id = str(uuid.uuid4())
            conversation_data = {
                "conversation_id": conversation_id,
                "user_id": str(user["_id"]),
                "title": title or prompt.prompt[:30] + "...",
                "created_at": timestamp,
                "updated_at": timestamp
            }
            await database.create_conversation(conversation_data)

        # Add message to conversation
        message_data = {
            "conversation_id": conversation_id,
            "prompt": prompt.prompt,
            "response": response_text,
            "timestamp": timestamp
        }
        await database.add_message_to_conversation(conversation_id, message_data)

        # Update user quota
        quota_deduction = 2 if not prompt.conversation_id else 1  # Extra deduction for title generation
        if user.get("quota", {}).get("text_quota", 0) > 0:
            await database.users_collection.update_one(
                {"_id": user["_id"]},
                {"$inc": {"quota.text_quota": -quota_deduction}}
            )

        # Get updated conversation
        conversation = await database.get_conversation(conversation_id, str(user["_id"]))
        
        response = {
            "conversation_id": conversation_id,
            "title": conversation["title"],
            "messages": conversation["messages"],
            "timestamp": timestamp.isoformat()
        }
        
        if user.get("quota", {}).get("text_quota", 0) <= 10:
            response["warning"] = "Your text quota is running low."

        return response
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversation", response_model=ConversationResponse)
async def create_or_continue_conversation(conversation: ConversationCreate):
    user = await database.find_user_by_email(conversation.user_email)
    if not user or user.get("quota", {}).get("text_quota", 0) == 0:
        raise HTTPException(status_code=403, detail="Insufficient quota, please upgrade your plan")

    try:
        # Generate response based on user's level
        if conversation.level.lower() == "openai":
            response_text = await generate_response(conversation.prompt)
            if not conversation.conversation_id and not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response(title_prompt)
                title = title.strip().strip('"\'').strip()
        elif conversation.level.lower() == "deepseek":
            response_text = await generate_response_deepseek(conversation.prompt)
            if not conversation.conversation_id and not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response_deepseek(title_prompt)
                title = title.strip().strip('"\'').strip()
        elif conversation.level.lower() == "grok":
            response_text = await generate_response_grok(conversation.prompt)
            if not conversation.conversation_id and not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response_grok(title_prompt)
                title = title.strip().strip('"\'').strip()
        else:
            raise HTTPException(status_code=400, detail="Invalid level")

        timestamp = datetime.utcnow()
        
        # If this is a new conversation
        if not conversation.conversation_id:
            conversation_id = str(uuid.uuid4())
            conversation_data = {
                "conversation_id": conversation_id,
                "user_id": str(user["_id"]),
                "title": conversation.title or title or conversation.prompt[:30] + "...",
                "created_at": timestamp,
                "updated_at": timestamp
            }
            await database.create_conversation(conversation_data)
        else:
            conversation_id = conversation.conversation_id
            # Verify the conversation exists and belongs to the user
            existing_conv = await database.get_conversation(conversation_id, str(user["_id"]))
            if not existing_conv:
                raise HTTPException(status_code=404, detail="Conversation not found")

        # Add the message to the conversation
        message_data = {
            "conversation_id": conversation_id,
            "prompt": conversation.prompt,
            "response": response_text,
            "timestamp": timestamp
        }
        await database.add_message_to_conversation(conversation_id, message_data)

        # Update user quota
        quota_deduction = 2 if not conversation.conversation_id and not conversation.title else 1
        if user.get("quota", {}).get("text_quota", 0) > 0:
            await database.users_collection.update_one(
                {"_id": user["_id"]},
                {"$inc": {"quota.text_quota": -quota_deduction}}
            )

        # Get the updated conversation
        conv = await database.get_conversation(conversation_id, str(user["_id"]))
        
        response = {
            "conversation_id": conversation_id,
            "title": conv["title"],
            "messages": conv["messages"],
            "timestamp": timestamp.isoformat()
        }

        if user.get("quota", {}).get("text_quota", 0) <= 10:
            response["warning"] = "Your text quota is running low."

        return response

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_user_conversations(user_email: str):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        conversations = await database.get_user_conversations(str(user["_id"]))
        
        return [{
            "conversation_id": conv["conversation_id"],
            "title": conv["title"],
            "updated_at": conv["updated_at"].isoformat(),
            "created_at": conv["created_at"].isoformat()
        } for conv in conversations]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, user_email: str):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        conversation = await database.get_conversation(conversation_id, str(user["_id"]))
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return conversation

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/conversation/{conversation_id}")
async def delete_conversation(conversation_id: str, user_email: str):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        success = await database.delete_conversation(conversation_id, str(user["_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {"message": "Conversation deleted successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/conversation/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    user_email: str,
    new_title: str = Body(..., embed=True)
):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        success = await database.update_conversation_title(
            conversation_id,
            str(user["_id"]),
            new_title
        )
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {"message": "Title updated successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/history", response_model=List[TextResponse])
async def get_history(user_email: str = Body(..., embed=True)): 
    try:
        # Tìm người dùng theo email
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Lấy lịch sử các prompt từ cơ sở dữ liệu
        prompts = await database.db.text.find({"email": user_email}).sort("timestamp", DESCENDING).to_list(100)
        return [
            {"prompt": item["prompt"], "response": item["response"]}
            for item in prompts
        ]
    
    except Exception as e:
        # Trả về lỗi nếu có
        raise HTTPException(status_code=500, detail=str(e))
