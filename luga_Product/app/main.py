from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import voice
from app.api import video
from app.api import text
from app.api import user
from app.api import stripe
app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Welcome to the LuGaAI API"}

# Thêm middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả các nguồn
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép tất cả các phương thức (GET, POST, PUT, DELETE...)
    allow_headers=["*"],  # Cho phép tất cả các headers
)

app.include_router(voice.router, prefix="/api/voice")
app.include_router(video.router, prefix="/api/video")
app.include_router(text.router, prefix="/api/text")
app.include_router(user.router, prefix="/api/user")
app.include_router(stripe.router, prefix="/api/stripe")
