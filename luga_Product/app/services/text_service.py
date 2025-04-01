from openai import AsyncOpenAI, OpenAI
from app.core.config import Config


async def generate_response(prompt: str) -> str:
    try:
        client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            store=True,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")
    
async def generate_response_deepseek(prompt: str) -> str:
    try:
        client = OpenAI(api_key=Config.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            store=True,
            temperature=0.7,
            stream=False
        )
        return response.choices[0].message.content.strip()  
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")
    
async def generate_response_grok(prompt: str) -> str:
    try:
        client = OpenAI(
            api_key=Config.GROK_API_KEY,
            base_url="https://api.x.ai/v1",
        )

        completion = client.chat.completions.create(
            model="grok-2-latest",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt},
            ],
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")
