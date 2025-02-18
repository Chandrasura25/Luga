from datetime import timedelta, timezone, datetime
import logging
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
    # Define quota mapping
QUOTA_MAP = {
    "Test Leap": {"audio_quota": 5 * 60, "video_quota": 0, "text_quota": 0, "process_video_quota": 0},
    "Demo": {"audio_quota": 5 * 60, "video_quota": 5 * 60, "text_quota": 0, "process_video_quota": 0},
    "Starter": {"audio_quota": 60 * 60, "video_quota": 60 * 60, "text_quota": -1, "process_video_quota": 3},
    "Creator": {"audio_quota": 240 * 60, "video_quota": 240 * 60, "text_quota": -1, "process_video_quota": 5},
    "Team": {"audio_quota": 32400, "video_quota": 32400, "text_quota": -1, "process_video_quota": 10},
}
# Initialize logging
logger = logging.getLogger(__name__)
@router.post("/stripe-webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, stripe_webhook_secret)
    except ValueError:
        logger.error("Invalid Stripe payload")
        raise HTTPException(status_code=400, detail="Invalid Payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid Stripe signature")
        raise HTTPException(status_code=400, detail="Invalid Signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_email = session.get("customer_email")
        plan_name = session.get("metadata", {}).get("name")

        if not user_email or not plan_name:
            logger.warning("Missing user email or plan name in session metadata")
            raise HTTPException(status_code=400, detail="Missing user email or plan name")

        quota = QUOTA_MAP.get(plan_name)
        if not quota:
            logger.warning(f"Plan '{plan_name}' not found in quota map")
            raise HTTPException(status_code=400, detail="Invalid plan name")

        user = await database.find_user_by_email(user_email)
        if user:
            current_plan = user.get("plan_name")
            current_quota = user.get("quota", {})

            if current_plan:
                logger.info(f"User {user_email} is upgrading from {current_plan} to {plan_name}")

                # Retain remaining quota if upgrading
                for key in quota.keys():
                    if key in current_quota:
                        quota[key] += max(0, current_quota[key])

            await database.update_status(user_email, "active", quota, plan_name)
            logger.info(f"Updated quota for {user_email} with plan {plan_name}")
        else:
            logger.warning(f"User {user_email} not found in database")

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