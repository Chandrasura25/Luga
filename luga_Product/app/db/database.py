from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import Config
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException

class Database:
    def __init__(self):
        self.client = AsyncIOMotorClient(Config.MONGO_DB_URL)
        self.db = self.client[Config.MONGO_DB_NAME] #Audio client["Audio"]
        self.users_collection = self.client["luga"]["users"] 
        self.blacklist_collection = self.client["luga"]["blacklist_tokens"]
    #Find User Using Input Email
    async def find_user_by_email(self, email):
        collection = self.client["luga"]["users"]
        user = await collection.find_one({"email": email})
        if (user):
            return user
        else:   
            return 
    #Blacklist JWT Token functions
    async def is_token_blacklisted(self, token: str) -> bool:
        return await self.blacklist_collection.find_one({"token": token}) is not None
    async def blacklist_token(self, token: str, expires_in: int = 1):
        expire_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in)
        await self.blacklist_collection.insert_one({"token": token, "expire_at": expire_at}) 
        
    #Stripe
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
                {"subscription_plan": "inactive"},
                {"usage_limit": "10"}
            }
            await self.client["luga"]["users"].update_one(
                {"email": email},
                {"$set": update_data}    
            )
            return {"message": "Subscription expired. Downgraded to 'normal'."}
        return {"message": "Subscription is still active."}

database = Database()