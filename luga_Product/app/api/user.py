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

router = APIRouter()

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
        return {"message": "Password reset successful", "user": user}
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
        return RedirectResponse(url="https://www.luga.app/login", status_code=status.HTTP_302_FOUND)

    await database.users_collection.update_one(
        {"email": email},
        {"$set": {"verified": True, "verification_token": None}}
    )
    access_token_expires = timedelta(minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": email}, expires_delta=access_token_expires)
    return RedirectResponse(url=f"https://www.luga.app/login?token={access_token}&email={email}", status_code=status.HTTP_302_FOUND)

    # return RedirectResponse(url="https://www.luga.app/login", status_code=status.HTTP_302_FOUND)

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
    verification_url = f"https://www.luga.app/api/user/verify?token={verification_token}"
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
