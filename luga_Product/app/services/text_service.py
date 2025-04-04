from openai import AsyncOpenAI, OpenAI
from app.core.config import Config
import re

def clean_response(text: str) -> str:
    # Remove any special characters that might appear at the start or end
    text = text.strip()
    
    # Remove any zero-width spaces, invisible characters, and other special Unicode characters
    text = re.sub(r'[\u200B-\u200D\uFEFF\u2028\u2029\u0000-\u001F\u007F-\u009F]', '', text)
    
    # Remove any excessive newlines (more than 2 in a row)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Remove extra spaces between words
    text = re.sub(r'\s+', ' ', text)
    
    # Fix markdown headers that might have extra #'s
    text = re.sub(r'#{3,}\s*', '## ', text)
    
    # Ensure proper spacing after punctuation
    text = re.sub(r'([.,!?])([^\s\d])', r'\1 \2', text)
    
    # Remove any leading/trailing whitespace from each line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    
    # Ensure consistent newlines between sections
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

async def generate_response(prompt: str) -> str:
    try:
        client = AsyncOpenAI(api_key=Config.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )
        return clean_response(response.choices[0].message.content)
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")
    
async def generate_response_deepseek(prompt: str) -> str:
    try:
        client = OpenAI(api_key=Config.DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
            stream=False
        )
        return clean_response(response.choices[0].message.content)
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
        return clean_response(completion.choices[0].message.content)
    except Exception as e:
        raise ValueError(f"An error occurred: {str(e)}")
