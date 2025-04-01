from typing import List
from fastapi import APIRouter, Body, HTTPException
from pymongo.command_cursor import DESCENDING
from app.services.text_service import generate_response, generate_response_deepseek, generate_response_grok
from app.database import database
from datetime import datetime
from app.db.models import TextCreate, TextResponse, ConversationCreate

router = APIRouter()

@router.post("/history", response_model=List[TextResponse])
async def get_history(user_email: str = Body(..., embed=True)): 
    try:
        # Find user by email
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get conversation history grouped by date
        pipeline = [
            {"$match": {"user_id": str(user["_id"])}},
            {"$sort": {"timestamp": DESCENDING}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$timestamp"
                        }
                    },
                    "conversations": {
                        "$push": {
                            "prompt": "$prompt",
                            "response": "$response",
                            "timestamp": "$timestamp"
                        }
                    }
                }
            },
            {"$sort": {"_id": -1}}  # Sort dates in descending order
        ]

        conversations = await database.db.text.aggregate(pipeline).to_list(None)
        
        # Format the response
        history = []
        for day in conversations:
            history.extend([
                {
                    "prompt": conv["prompt"],
                    "response": conv["response"],
                    "timestamp": conv["timestamp"].isoformat(),
                    "date": day["_id"]
                }
                for conv in day["conversations"]
            ])

        return history
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversation_dates(user_email: str):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get unique conversation dates
        pipeline = [
            {"$match": {"user_id": str(user["_id"])}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$timestamp"
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": -1}}
        ]

        dates = await database.db.text.aggregate(pipeline).to_list(None)
        return [{"date": date["_id"], "count": date["count"]} for date in dates]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversation", response_model=TextResponse)
async def create_conversation(conversation: ConversationCreate):
    user = await database.find_user_by_email(conversation.user_email)
    if not user or user.get("quota", {}).get("text_quota", 0) == 0:
        raise HTTPException(status_code=403, detail="Insufficient quota, please upgrade your plan")

    try:
        # Generate conversation ID if not provided
        conversation_id = conversation.conversation_id or str(datetime.utcnow().timestamp())

        # Generate response based on user's level
        if user.get("level").lower() == "openai":
            response_text = await generate_response(conversation.prompt)
            # Generate title summary if not provided
            if not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response(title_prompt)
                # Clean up the title (remove quotes, newlines, etc)
                title = title.strip().strip('"\'').strip()
        elif user.get("level").lower() == "deepseek":
            response_text = await generate_response_deepseek(conversation.prompt)
            if not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response_deepseek(title_prompt)
                title = title.strip().strip('"\'').strip()
        elif user.get("level").lower() == "grok":
            response_text = await generate_response_grok(conversation.prompt)
            if not conversation.title:
                title_prompt = f"Generate a brief 3-5 word title summarizing this conversation:\n{conversation.prompt}"
                title = await generate_response_grok(title_prompt)
                title = title.strip().strip('"\'').strip()
        else:
            raise HTTPException(status_code=400, detail="Invalid level")

        # Store the conversation
        conversation_data = {
            "conversation_id": conversation_id,
            "prompt": conversation.prompt,
            "response": response_text,
            "timestamp": datetime.utcnow(),
            "user_id": str(user["_id"]),
            "title": conversation.title or title or conversation.prompt[:30] + "..."  # Use generated title or fallback
        }
        
        await database.db.text.insert_one(conversation_data)

        # Update user quota
        if user.get("quota", {}).get("text_quota", 0) > 0:
            # Deduct 2 from quota (1 for response, 1 for title generation)
            quota_deduction = 2 if not conversation.title else 1
            await database.db.users.update_one(
                {"email": conversation.user_email},
                {"$inc": {"quota.text_quota": -quota_deduction}}
            )

            if user.get("quota", {}).get("text_quota", 0) <= 10:
                return {
                    "prompt": conversation.prompt,
                    "response": response_text,
                    "conversation_id": conversation_id,
                    "title": conversation_data["title"],
                    "warning": "Your text quota is running low."
                }

        return {
            "prompt": conversation.prompt,
            "response": response_text,
            "conversation_id": conversation_id,
            "timestamp": conversation_data["timestamp"].isoformat(),
            "title": conversation_data["title"]
        }

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, user_email: str):
    try:
        user = await database.find_user_by_email(user_email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get all messages in the conversation
        messages = await database.db.text.find({
            "conversation_id": conversation_id,
            "user_id": str(user["_id"])
        }).sort("timestamp", DESCENDING).to_list(None)

        if not messages:
            raise HTTPException(status_code=404, detail="Conversation not found")

        return {
            "conversation_id": conversation_id,
            "title": messages[0].get("title"),
            "messages": [
                {
                    "prompt": msg["prompt"],
                    "response": msg["response"],
                    "timestamp": msg["timestamp"].isoformat()
                }
                for msg in messages
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 