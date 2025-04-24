import re

from fastapi import APIRouter, UploadFile, HTTPException, File, Form, Request, BackgroundTasks, status, Body
from fastapi.responses import JSONResponse, Response, RedirectResponse
from typing import Dict, Optional, Union
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from app.services.video_service import SyncLabsVideoService
from app.db.models import User, TokenResponse, TokenLogOut
from app.db.database import database
from app.core.config import Config
from pymongo.errors import DuplicateKeyError
from email.message import EmailMessage
from app.utils import verification_email_content, forgot_password_email_content
import uuid
import stripe
import smtplib
import bcrypt
import jwt
import asyncio
import pyotp
import cloudinary
import cloudinary.uploader
from app.services.cloudinary import upload_file_to_cloudinary
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import facebook

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=Config.CLOUDINARY_CLOUD_NAME,
    api_key=Config.CLOUDINARY_API_KEY,
    api_secret=Config.CLOUDINARY_API_SECRET
)

async def upload_profile_image_to_cloudinary(file: UploadFile) -> Dict:
    """
    Upload a profile image to Cloudinary with specific settings for profile images.
    Returns the Cloudinary upload result.
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Upload to Cloudinary with profile image specific settings
        upload_result = cloudinary.uploader.upload(
            contents,
            folder="profile_images",
            allowed_formats=["jpg", "jpeg", "png", "gif"],
            transformation=[
                {"width": 400, "height": 400, "crop": "fill"},
                {"quality": "auto:good"}
            ],
            resource_type="image"
        )
        
        await file.seek(0)  # Reset file pointer for potential reuse
        return upload_result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to Cloudinary: {str(e)}"
        )

def validate_email(email: str) -> bool:
    # validate email format
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None

# Send Email Function
def send_email(to_email, subject, url):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = Config.SMTP_USERNAME
    msg["To"] = to_email
    msg.add_alternative(verification_email_content(url), subtype="html")
    print(Config.SMTP_SERVER)
    print(Config.SMTP_PORT)
    print(Config.SMTP_USERNAME)
    print(Config.SMTP_PASSWORD)
    with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
        server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
        server.send_message(msg)
def send_password_reset_email(to_email, reset_code):
    msg = EmailMessage()
    msg["Subject"] = "Password Reset Code"
    msg["From"] = Config.SMTP_USERNAME
    msg["To"] = to_email
    msg.add_alternative(forgot_password_email_content(reset_code), subtype="html")
    with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT) as server:
        server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
        server.send_message(msg)
#Create Verification Token
def create_verification_token(email):
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(data={"sub": email}, expires_delta=access_token_expires)
@router.post("/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_email(email=email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Generate a random password reset code
        reset_code = str(uuid.uuid4())[:6].upper()
        # Update the user's password reset code in the database
        await database.update_user_password_reset_code(email, reset_code)
        # Send the reset code to the user's email
        send_password_reset_email(email, reset_code)
        return {"message": "Password reset email sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/reset-password")
async def reset_password(reset_code: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_password_reset_code(reset_code)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Convert ObjectId to string to avoid serialization issues
        user["_id"] = str(user["_id"])
        return {"message": "Password reset successful", "email": user["email"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/password-reset")
async def password_reset(password: str = Body(..., embed=True), email: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Update the user's password in the database
        await database.update_user_password(email, password)
        return {"message": "Password reset successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
#Verify
@router.get("/verify")
async def verify_email(token: str):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        email = payload["sub"]  
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Verification link expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await database.users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    if user["verified"]:
        # return {"message": "Email already verified"}
        return RedirectResponse(url="https://www.luga-ai.com/login", status_code=status.HTTP_302_FOUND)

    await database.users_collection.update_one(
        {"email": email},
        {"$set": {"verified": True, "verification_token": None}}
    )
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": email}, expires_delta=access_token_expires)
    return RedirectResponse(url=f"https://www.luga-ai.com/login?token={access_token}&email={email}", status_code=status.HTTP_302_FOUND)

    # return RedirectResponse(url="https://www.luga-ai.com/login", status_code=status.HTTP_302_FOUND)

    # return {"message": "Email successfully verified! You can now log in."}

#Register
@router.post("/register")
async def create_user(user: User, background_tasks: BackgroundTasks):
    email = user.email
    username = user.username
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    salt = bcrypt.gensalt()
    password = bcrypt.hashpw(user.password.encode("utf-8"), salt).decode("utf-8")
    existingUser = await database.find_user_by_email(email=email)
    if (existingUser):
        return {"success": False, "message": "Email already exists."}
    
    #Comment for Verification
    verification_token = create_verification_token(email)
    #Store user as unverified
    new_user = {
        "id": str(ObjectId()),
        "email": email,
        "password": password,
        "username": username,
        "created_at": datetime.now(timezone.utc),
        "usage_limit": 10,
        "subscription_status": "inactive",
        "expire_date": datetime.now(timezone.utc),
        "verified": False,
        "verification_token": verification_token,
    }
    verification_url = f"https://www.luga-ai.com/api/user/verify?token={verification_token}"
    background_tasks.add_task(send_email, email, "Verify Your Email", f"{verification_url}")

    try:
        result = await database.users_collection.insert_one(new_user)
        # return {"success": True, "user_id": str(result.inserted_id), "message": "Register Successfully"}
        return {"success": True, "user_id": str(result.inserted_id), "message": "Please check your email for verification."}
    except DuplicateKeyError:
        return {"success": False, "message": "Email already exists"}
    except Exception as e:
        return {"success": False, "message": str(e)}

#Access Token
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=1440)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, Config.SECRET_KEY, algorithm=Config.ALGORITHM)
    return encoded_jwt

#Login
@router.post("/login", response_model=TokenResponse)
async def login(InputUser: User):
    email = InputUser.email
    password = InputUser.password
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format.")
    CheckUser = await database.find_user_by_email(email=email)
    if not CheckUser:
         raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Comment for verification
    if not CheckUser["verified"]:
        raise HTTPException(status_code=400, detail="Email not verified. Check your inbox.")

    if not bcrypt.checkpw(password.encode("utf-8"), CheckUser["password"].encode("utf-8")):
         raise HTTPException(status_code=400, detail="Invalid email or password")
    
    #Create JWT Token
    subscription_status = await database.downgrade_expired_subscriptions(email)
    # print(subscription_status["message"])
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": email}, expires_delta=access_token_expires)
    stripe.api_key = Config.STRIPE_API_KEY
    prices = stripe.Price.list(limit=10)
    num_items = len(prices["data"])
    # print("THE QUPANTITY: ", num_items)
    # for price in prices["data"]:
    #     product = stripe.Product.retrieve(price["product"])  
    #     print(f"Product: {product['name']}, Price ID: {price['id']}, Amount: {price['unit_amount'] / 100} {price['currency'].upper()}")
    return {"access_token": access_token, "token_type": "bearer"}
@router.post("/balance")
async def get_balance(user_email: str = Body(..., embed=True)): 
    user = await database.find_user_by_email(user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"subscription_plan": user["subscription_plan"], "balance": user["quota"]}
#Signoff
@router.post("/logout")
async def logout(request: TokenLogOut):
    try:    
        token = request.token
        print(token)
        if await database.is_token_blacklisted(token):
            raise HTTPException(status_code=400, detail="Token is already invalidated")
        await database.blacklist_token(token)  # Add token to blacklist
        return {"message": "Successfully logged out"}
    except Exception as e:
        return {"message": str(e)}

# Function to delete specific accounts
async def delete_specific_accounts():
    emails_to_delete = [
        "wulichaodu@gmail.com",
        "dasidehappy@outlook.com",
        "2598941878@qq.com"
    ]
    for email in emails_to_delete:
        result = await database.users_collection.delete_one({"email": email})
        if result.deleted_count > 0:
            print(f"Deleted account with email: {email}")
        else:
            print(f"No account found with email: {email}")

# asyncio.create_task(delete_specific_accounts())

# Profile endpoints
@router.post("/profile")
async def get_profile(email: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert ObjectId to string and remove sensitive information
        user_dict = {
            "id": str(user.get("_id")),
            "email": user.get("email"),
            "username": user.get("username"),
            "profile_image": user.get("profile_image"),
            "two_factor_enabled": user.get("two_factor_enabled", False),
            "invitation_code": user.get("invitation_code"),
            "subscription_status": user.get("subscription_status"),
            "subscription_plan": user.get("subscription_plan"),
            "subscription_expiry": user.get("subscription_expiry"),
            "google_id": user.get("google_id"),
            "quota": user.get("quota"),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
        }
        
        return user_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/update")
async def update_profile(
    email: str = Body(...),
    username: Optional[str] = Body(None),
    current_password: Optional[str] = Body(None),
    new_password: Optional[str] = Body(None)
):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = {}
        
        # Update username if provided
        if username:
            update_data["username"] = username
        
        # Update password if provided
        if current_password and new_password:
            if not bcrypt.checkpw(current_password.encode("utf-8"), user["password"].encode("utf-8")):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), salt).decode("utf-8")
            update_data["password"] = hashed_password
        
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            await database.users_collection.update_one(
                {"email": email},
                {"$set": update_data}
            )
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/upload-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    email: str = Form(...)
):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/gif"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG, PNG, and GIF images are allowed"
            )
        
        # Upload to Cloudinary using our custom function
        result = await upload_profile_image_to_cloudinary(file)
        if not result or not result.get("secure_url"):
            raise HTTPException(
                status_code=500,
                detail="Failed to upload image"
            )
        
        # Update user profile with image URL
        await database.users_collection.update_one(
            {"email": email},
            {"$set": {
                "profile_image": result["secure_url"],
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {
            "message": "Profile image updated",
            "image_url": result["secure_url"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/enable-2fa")
async def enable_2fa(email: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate new TOTP secret
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        
        # Update user with 2FA secret (not enabled yet)
        await database.users_collection.update_one(
            {"email": email},
            {"$set": {
                "two_factor_secret": secret,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Generate QR code provisioning URI
        provisioning_uri = totp.provisioning_uri(email, issuer_name="Luga AI")
        
        return {
            "secret": secret,
            "provisioning_uri": provisioning_uri,
            "message": "2FA setup initiated. Please verify the code to complete setup."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/verify-2fa")
async def verify_2fa(
    email: str = Body(...),
    code: str = Body(...)
):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("two_factor_secret"):
            raise HTTPException(status_code=400, detail="2FA setup not initiated")
        
        # Verify the code
        totp = pyotp.TOTP(user["two_factor_secret"])
        if not totp.verify(code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Enable 2FA
        await database.users_collection.update_one(
            {"email": email},
            {"$set": {
                "two_factor_enabled": True,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"message": "2FA enabled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/disable-2fa")
async def disable_2fa(
    email: str = Body(...),
    code: str = Body(...)
):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("two_factor_enabled"):
            raise HTTPException(status_code=400, detail="2FA is not enabled")
        
        # Verify the code
        totp = pyotp.TOTP(user["two_factor_secret"])
        if not totp.verify(code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
        # Disable 2FA
        await database.users_collection.update_one(
            {"email": email},
            {"$set": {
                "two_factor_enabled": False,
                "two_factor_secret": None,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"message": "2FA disabled successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/delete-account")
async def delete_account(
    email: str = Body(...),
    password: str = Body(...),
    confirmation: bool = Body(...)
):
    try:
        if not confirmation:
            raise HTTPException(status_code=400, detail="Please confirm account deletion")
        
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify password
        if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            raise HTTPException(status_code=400, detail="Invalid password")
        
        # Delete user data
        await database.users_collection.delete_one({"email": email})
        
        # Delete user's conversations
        await database.conversations_collection.delete_many({"user_id": str(user["_id"])})
        
        # Delete user's messages
        await database.messages_collection.delete_many({"user_id": str(user["_id"])})
        
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/generate-invitation")
async def generate_invitation(email: str = Body(..., embed=True)):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate unique invitation code
        invitation_code = str(uuid.uuid4())[:8].upper()
        
        # Update user with invitation code
        await database.users_collection.update_one(
            {"email": email},
            {"$set": {
                "invitation_code": invitation_code,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        return {"invitation_code": invitation_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/google")
async def google_auth(token: str = Body(..., embed=True)):
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            Config.GOOGLE_CLIENT_ID
        )
        print("IDINFO: ", idinfo)
        # Get user info from token
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        # Check if user exists
        user = await database.find_user_by_email(email)
        
        if not user:
            # Create new user
            new_user = {
                "id": str(ObjectId()),
                "email": email,
                "username": name,
                "profile_image": picture,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "verified": True,  # Google accounts are pre-verified
                "google_id": str(idinfo['sub']),
                "subscription_status": "inactive",
            }
            
            await database.users_collection.insert_one(new_user)
            user = new_user
        else:
            # Update existing user with Google info
            await database.users_collection.update_one(
                {"email": email},
                {"$set": {
                    "google_id": str(idinfo['sub']),
                    "profile_image": picture,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )

        # Generate access token
        access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": email,
                "username": name,
                "profile_image": picture
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid Google token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/facebook")
async def facebook_auth(access_token: str = Body(...)):
    try:
        # Verify Facebook token and get user info
        graph = facebook.GraphAPI(access_token=access_token)
        profile = graph.get_object(
            'me',
            fields='id,name,email,picture.type(large)'
        )

        email = profile.get('email')
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Email not provided by Facebook"
            )

        name = profile.get('name', '')
        picture = profile.get('picture', {}).get('data', {}).get('url', '')

        # Check if user exists
        user = await database.find_user_by_email(email)
        
        if not user:
            # Create new user
            new_user = {
                "id": str(ObjectId()),
                "email": email,
                "username": name,
                "profile_image": picture,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "verified": True,  # Facebook accounts are pre-verified
                "facebook_id": profile['id'],
                "subscription_status": "inactive",
                "subscription_plan": "Demo",
                "usage_limit": 10,
            }
            
            result = await database.users_collection.insert_one(new_user)
            user = new_user
        else:
            # Update existing user with Facebook info
            await database.users_collection.update_one(
                {"email": email},
                {"$set": {
                    "facebook_id": profile['id'],
                    "profile_image": picture,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )

        # Generate access token
        access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": email,
                "username": name,
                "profile_image": picture
            }
        }

    except facebook.GraphAPIError as e:
        raise HTTPException(status_code=400, detail="Invalid Facebook token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/profile/unlink-social")
async def unlink_social_account(
    email: str = Body(...),
    platform: str = Body(...)  # "google" or "facebook"
):
    try:
        user = await database.find_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if it's the only authentication method
        has_password = "password" in user
        has_google = "google_id" in user
        has_facebook = "facebook_id" in user
        
        auth_methods = sum([
            bool(has_password),
            bool(has_google and platform != "google"),
            bool(has_facebook and platform != "facebook")
        ])
        
        if auth_methods == 0:
            raise HTTPException(
                status_code=400,
                detail="Cannot unlink the only authentication method. Please add another method first."
            )

        # Remove the social ID
        unset_field = f"{platform}_id"
        await database.users_collection.update_one(
            {"email": email},
            {
                "$unset": {unset_field: ""},
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )

        return {"message": f"{platform.capitalize()} account unlinked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

