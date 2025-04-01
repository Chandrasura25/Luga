import requests
from fastapi import HTTPException
from app.core.config import Config

class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.api_key = Config.ELEVEN_LABS_API_KEY
        if not self.api_key:
            raise ValueError("Eleven Labs API key is missing. Please configure it correctly.")

    def get_voices(self) -> list:
        url = f"{self.BASE_URL}/voices"
        headers = {
            "xi-api-key": self.api_key
        }
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching voices from Eleven Labs API")

        return response.json().get("voices", [])

    def text_to_speech(self, voice_id: str, text: str) -> str:
        url = f"{self.BASE_URL}/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "output_format": "mp3_44100_128",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5,

            }
        }
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from Eleven Labs API")
        
        return response.content

    def clone_voice(self, name: str, description: str, audio_file: bytes) -> dict:
        """
        Clone a voice using an audio file.
        """
        url = f"{self.BASE_URL}/voices/add"
        headers = {
            "Accept": "application/json",
            "xi-api-key": self.api_key
        }
        
        files = {
            'files': ('recording.mp3', audio_file, 'audio/mpeg'),
            'name': (None, name),
            'description': (None, description),
        }
        
        response = requests.post(url, headers=headers, files=files)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error cloning voice with Eleven Labs API")
        
        return response.json()
    def get_voice_by_id(self, voice_id: str) -> dict:
        url = f"{self.BASE_URL}/voices/{voice_id}"
        headers = {
            "xi-api-key": self.api_key
        }
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching voice by id from Eleven Labs API")
        return response.json()
