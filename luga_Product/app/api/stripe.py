from datetime import timedelta, timezone, datetime
import bcrypt
from fastapi import APIRouter, HTTPException, Request
import stripe
import stripe.error
from app.db.models import TokenResponse, User, SubscriptionRequest
from app.db.database import database
from app.core.config import Config

router = APIRouter()
stripe.api_key = Config.STRIPE_API_KEY
frontend_url = Config.FRONTEND_URL

@router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, Config.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid Payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid Signature")
    
    if event["type"] == "checkout.session.completed":
        print(event)
        session = event["data"]["object"]
        user_email = session["customer_email"]
        name = session["name"]
        price_id = session["metadata"]["priceId"]
        
        # Define quota based on the plan
        quota_map = {
            "Test Leap": {"audio_quota": 300},  # 5 minutes in seconds
            "Demo": {"audio_quota": 300, "video_quota": 300},
            "Starter": {"text_quota": -1, "audio_quota": 3600, "video_quota": 3600},
            "Creator": {"text_quota": -1, "audio_quota": 14400, "video_quota": 14400},
            "Team": {"text_quota": -1, "audio_quota": 32400, "video_quota": 32400},
        }
        
        quota = quota_map.get(name, {})
        
        user = await database.find_user_by_email(user_email)
        if user:
            await database.db.users.update_one(
                {"email": user_email},
                {"$set": {"subscription_status": "active", **quota}}
            )
    
    return {"status": "Success"}
# @router.post("/stripe-webhook")
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get("stripe-signature")

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, 
#         )
#     except ValueError as e:
#         raise HTTPException(status_code=400, detail="Invalid Payload")
#     except stripe.error.SignatureVerificationError as e :
#         raise HTTPException(status_code=400, detail="Invalid Signature")
    
#     if event["type"] == "checkout.session.completed":
#         subscription = event["data"]["object"] 
#         user_email = subscription["customer_email"]
#         status = subscription["status"]
#         price_id = subscription["metadata"]["priceId"]
        
#         duration_map = {
#             "price_1_month": timedelta(days=30),
#             "price_1_year": timedelta(days=365)
#         }
#         duration = duration_map.get(price_id, timedelta(days=30))
#         user = await database.find_user_by_email(user_email)
#         if user:
#              #get current expire_date
#             current_expire_date = user.get("expire_date", datetime.now(timezone.utc)) if user else datetime.now(timezone.utc)

#             new_expire_date = max(datetime.now(timezone.utc), current_expire_date) + duration
#             result = await database.update_status(user_email, status, new_expire_date)
#     return {"status":"Success"}

@router.post("/subs")
async def create_subscription_session(subs_request: SubscriptionRequest):
    email = subs_request.email
    price = subs_request.priceId
    try:
        
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items= [{
                "price": price,
                "quantity": 1,
            }],
            #It's a onetime payment, not subscription
            mode="payment",
            success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cancel",
            customer_email=email,
            metadata={"priceId": price, "email": email}
        )
        return {"session_id": session.id}
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/subscription_plans")   
async def get_subscription_plans():
    try:
        plans = stripe.Product.list(created={"gte": int(datetime(2025, 2, 16).timestamp()), "lte": int(datetime(2025, 2, 16, 23, 59, 59).timestamp())})
        for plan in plans['data']:
            prices = stripe.Price.list(product=plan['id'])
            plan['prices'] = prices['data']
        return plans['data']
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=400, detail=str(e))
# @router.get("/verify-payment")
# async def verify_payment(session_id: str):
#     try:
#         session = stripe.checkout.Session.retrieve(session_id)
#         if session.payment_status == "paid":
#             return {"status": "success", "email": session.customer_email}
#         else:
#             return {"status": "pending"}
#     except Exception as e:
#         return {"status": "error", "message": str(e)}