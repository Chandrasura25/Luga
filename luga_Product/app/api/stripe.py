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
stripe_webhook_secret = Config.STRIPE_WEBHOOK_SECRET

@router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid Payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid Signature")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_email = session["customer_email"]
        name = session["metadata"]["name"]
        # Define quota based on the plan
        quota_map = {
            #convert seconds to minutes
            "Test Leap": {"audio_quota": 5 * 60},  # 5 minutes in seconds
            "Demo": {"audio_quota": 5, "video_quota": 5},
            "Starter": {"text_quota": -1, "audio_quota": 60, "video_quota": 60},
            "Creator": {"text_quota": -1, "audio_quota": 240, "video_quota": 240},
            "Team": {"text_quota": -1, "audio_quota": 32400, "video_quota": 32400},
        }
        
        quota = quota_map.get(name, {})
        
        user = await database.find_user_by_email(user_email)
        if user:
            await database.update_status(user_email, "active", quota, name)
    
    return {"status": "Success"}

@router.post("/subscription_status")
async def get_subscription_status(request: Request):
    payload = await request.json()
    email = payload.get("email")  # Use .get() to avoid KeyError

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = await database.find_user_by_email(email)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("subscription_status") == "active":
        return {"subscription_plan": user.get("subscription_plan", "unknown")}
    else:
        raise HTTPException(status_code=403, detail="Subscription is not active")

@router.post("/subs")
async def create_subscription_session(subs_request: SubscriptionRequest):
    email = subs_request.email
    name = subs_request.name
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
            success_url="https://www.luga.app/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://www.luga.app/cancel",
            customer_email=email,
            metadata={"name": name, "email": email}
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