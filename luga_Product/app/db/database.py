from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import Config
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import bcrypt

quota_map = {
    "Test Leap": {"audio_quota": 5 * 60, "video_quota": 3 * 60, "text_quota": -1, "process_video_quota": 2},
    "Demo": {"audio_quota": 5 * 60, "video_quota": 5 * 60, "text_quota": -1, "process_video_quota": 2},
    "Starter": {"audio_quota": 60 * 60, "video_quota": 60 * 60, "text_quota": -1, "process_video_quota": 3},
    "Creator": {"audio_quota": 240 * 60, "video_quota": 240 * 60, "text_quota": -1, "process_video_quota": 5},
    "Team": {"audio_quota": 32400, "video_quota": 32400, "text_quota": -1, "process_video_quota": 10},
}

class Database:
    def __init__(self):
        self.client = AsyncIOMotorClient(Config.MONGO_DB_URL)
        self.db = self.client[Config.MONGO_DB_NAME]
        self.users_collection = self.client["luga"]["users"]
        self.blacklist_collection = self.client["luga"]["blacklist_tokens"]
        self.conversations_collection = self.client["luga"]["conversations"]
        self.messages_collection = self.client["luga"]["messages"]

    async def find_user_by_email(self, email):
        collection = self.client["luga"]["users"]
        user = await collection.find_one({"email": email})
        return user

    async def is_token_blacklisted(self, token: str) -> bool:
        return await self.blacklist_collection.find_one({"token": token}) is not None

    async def blacklist_token(self, token: str, expires_in: int = 1):
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in)
        await self.blacklist_collection.insert_one({"token": token, "expire_at": expire_at})

    async def update_status(self, email: str, status: str, quota: dict, name: str):
        result = await self.client["luga"]["users"].find_one_and_update(
            {"email": email},
            {"$set": {"subscription_status": status, "quota": quota, "subscription_plan": name}},
            return_document=True,
        )
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "Subscription updated successfully", "user": result}

    async def downgrade_expired_subscriptions(self, email: str):
        now = datetime.now(timezone.utc)
        user = await self.client["luga"]["users"].find_one({"email": email})
        if user.get("subscription_expiry") and user["subscription_expiry"] < now:
            update_data = {
                "subscription_plan": "inactive",
                "usage_limit": "10"
            }
            await self.client["luga"]["users"].update_one(
                {"email": email},
                {"$set": update_data}
            )
            return {"message": "Subscription expired. Downgraded to 'normal'."}
        return {"message": "Subscription is still active."}
    
    async def update_user_password_reset_code(self, email, reset_code):
        await self.client["luga"]["users"].update_one({"email": email}, {"$set": {"password_reset_code": reset_code}})
    async def find_user_by_password_reset_code(self, reset_code):
        user = await self.client["luga"]["users"].find_one({"password_reset_code": reset_code})
        if user:
            await self.client["luga"]["users"].update_one({"_id": user["_id"]}, {"$unset": {"password_reset_code": ""}})
        return user
    async def update_user_password(self, email, password):
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
        await self.client["luga"]["users"].update_one({"email": email}, {"$set": {"password": hashed_password}})
    def check_quota(self, user, content_type, duration):
        """ Check if user has enough quota before generating content """
        user_plan = user.get("subscription_plan", "")
        user_quota = quota_map.get(user_plan, {})

        used_time = user.get(f"used_{content_type}_time", 0)
        max_time = user_quota.get(f"{content_type}_quota", 0)

        if used_time + duration > max_time:
            raise HTTPException(status_code=403, detail=f"{content_type.capitalize()} quota exceeded. Upgrade to continue.")

    def check_process_quota(self, user):
        """ Check if user can process more videos simultaneously """
        user_plan = user.get("subscription_plan", "")
        process_limit = quota_map.get(user_plan, {}).get("process_video_quota", 0)
        active_processes = user.get("used_process_videos", 0)

        if active_processes >= process_limit:
                raise HTTPException(status_code=403, detail="Video processing limit reached. Please wait or upgrade your plan.")
    def check_text_quota(user, text):
        """ Check if user has enough text quota before processing """
        user_plan = user["plan"]
        max_text = quota_map[user_plan]["text_quota"]
        used_text = user.get("used_text_characters", 0)

        if max_text != -1 and used_text + len(text) > max_text:
            raise HTTPException(status_code=403, detail="Text quota exceeded. Upgrade your plan.")

    async def update_text_quota(user, text):
        """ Update the used text quota after processing """
        new_used_text = user["used_text_characters"] + len(text)
        await database.db.users.update_one({"_id": user["_id"]}, {"$set": {"used_text_characters": new_used_text}})

    async def create_conversation(self, conversation_data: dict):
        """Create a new conversation in MongoDB"""
        result = await self.conversations_collection.insert_one(conversation_data)
        return result.inserted_id

    async def add_message_to_conversation(self, conversation_id: str, message_data: dict):
        """Add a message to an existing conversation"""
        # Update conversation's last activity timestamp
        await self.conversations_collection.update_one(
            {"conversation_id": conversation_id},
            {"$set": {"updated_at": datetime.utcnow()}}
        )

        # Add the message
        message_data["conversation_id"] = conversation_id
        result = await self.messages_collection.insert_one(message_data)
        return result.inserted_id

    async def get_conversation(self, conversation_id: str, user_id: str):
        """Get a conversation and its messages"""
        # Get the conversation
        conversation = await self.conversations_collection.find_one({
            "conversation_id": conversation_id,
            "user_id": user_id
        })

        if not conversation:
            return None

        # Get all messages for this conversation
        messages = await self.messages_collection.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1).to_list(None)

        # Format messages
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "prompt": msg["prompt"],
                "response": msg["response"],
                "timestamp": msg["timestamp"].isoformat(),
                "conversation_id": conversation_id
            })

        return {
            "conversation_id": conversation["conversation_id"],
            "title": conversation["title"],
            "messages": formatted_messages,
            "created_at": conversation["created_at"].isoformat(),
            "updated_at": conversation["updated_at"].isoformat()
        }

    async def get_user_conversations(self, user_id: str):
        """Get all conversations for a user"""
        cursor = self.conversations_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1)

        conversations = await cursor.to_list(None)
        return conversations

    async def delete_conversation(self, conversation_id: str, user_id: str):
        """Delete a conversation and its messages"""
        # Delete the conversation
        result = await self.conversations_collection.delete_one({
            "conversation_id": conversation_id,
            "user_id": user_id
        })

        if result.deleted_count > 0:
            # Delete all associated messages
            await self.messages_collection.delete_many({
                "conversation_id": conversation_id
            })
            return True
        return False

    async def update_conversation_title(self, conversation_id: str, user_id: str, new_title: str):
        """Update conversation title"""
        result = await self.conversations_collection.update_one(
            {
                "conversation_id": conversation_id,
                "user_id": user_id
            },
            {
                "$set": {
                    "title": new_title,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0

database = Database()