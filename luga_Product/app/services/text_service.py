from openai import AsyncOpenAI
from app.core.config import Config

client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)

async def generate_response(prompt: str) -> str:
    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")