from fastapi import APIRouter, HTTPException
from typing import List
from app.db.models import TextCreate, TextResponse
from app.services.text_service import generate_response
from app.db.database import database
from pymongo import DESCENDING
from datetime import datetime

router = APIRouter()
async def notify_user(email: str, message: str):
    # TODO: Implement notification logic (e.g., send email, push notification)
    #send email to user
    
    pass

@router.post("/generate", response_model=TextResponse)
async def create_prompt(prompt: TextCreate):
    user = await database.find_user_by_email(prompt.user_email)
    # if not user or user.get("text_quota", 0) == 0:
    #     raise HTTPException(status_code=403, detail="Insufficient quota")

    try:
        response_text = await generate_response(prompt.prompt)
        
        prompt_data = {
            "prompt": prompt.prompt,
            "response": response_text,
            "timestamp": datetime.utcnow()
        }
        await database.db.text.insert_one(prompt_data)

        if user.get("text_quota", 0) > 0:
            await database.db.users.update_one(
                {"email": prompt.user_email},
                {"$inc": {"text_quota": -1}}
            )

            if user.get("text_quota", 0) <= 10:  # Notify when quota is low
                await notify_user(prompt.user_email, "Your text quota is running low.")

        return {"prompt": prompt.prompt, "response": response_text}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# @router.post("/generate", response_model=TextResponse)
# async def create_prompt(prompt: TextCreate):
#     try:
#         # Gọi dịch vụ để tạo phản hồi từ prompt
#         response_text = await generate_response(prompt.prompt)
        
#         # Lưu trữ prompt và response vào cơ sở dữ liệu
#         prompt_data = {
#             "prompt": prompt.prompt,
#             "response": response_text,
#             "timestamp": datetime.utcnow()
#         }
#         await database.db.text.insert_one(prompt_data)

#         return {"prompt": prompt.prompt, "response": response_text}
    
#     except Exception as e:
#         # Trả về lỗi nếu có
#         raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[TextResponse])
async def get_history():
    try:
        # Lấy lịch sử các prompt từ cơ sở dữ liệu
        prompts = await database.db.text.find().sort("timestamp", DESCENDING).to_list(100)
        return [
            {"prompt": item["prompt"], "response": item["response"]}
            for item in prompts
        ]
    
    except Exception as e:
        # Trả về lỗi nếu có
        raise HTTPException(status_code=500, detail=str(e))
