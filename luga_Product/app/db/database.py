from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import Config
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

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

database = Database()