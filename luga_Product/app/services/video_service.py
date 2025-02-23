import requests
from fastapi import HTTPException, UploadFile
from tempfile import NamedTemporaryFile
from moviepy import VideoFileClip
import os


class SyncLabsVideoService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.sync.so/v2"

    def sync_audio_with_video(
        self,
        audio_url: str,
        video_url: str,
        max_credits: int = None,
        model: str = "lipsync-1.7.1",  
        synergize: bool = True,
        webhook_url: str = None
    ):
        endpoint = f"{self.base_url}/generate"

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }

        # Ensure URLs are strings, not bytes
        video_url = video_url.decode("utf-8") if isinstance(video_url, bytes) else video_url
        audio_url = audio_url.decode("utf-8") if isinstance(audio_url, bytes) else audio_url

        # Construct payload
        payload = {
            "model": model,
            "input": [
                {"type": "video", "url": video_url},
                {"type": "audio", "url": audio_url}
            ],
            "options": {"output_format": "mp4"}
        }

        if webhook_url:
            payload["webhookUrl"] = webhook_url  # Only add if provided

        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            error_message = f"RequestException: {str(e)}"
            if e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message += f" | API Response: {error_data}"
                except ValueError:
                    error_message += f" | API Response (non-JSON): {e.response.text}"
            raise HTTPException(status_code=400, detail=error_message)

    def get_job_status(self, job_id: str):
        endpoint = f"{self.base_url}/generate/{job_id}"  
        
        headers = {
            "x-api-key": self.api_key
        }

        try:
            response = requests.get(endpoint, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as http_err:
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Job with id {job_id} not found")
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Unauthorized. Check your API key")
            elif response.status_code == 402:
                raise HTTPException(status_code=402, detail="Payment required. Check your credits")
            else:
                raise HTTPException(status_code=response.status_code, detail=f"400: {str(http_err)}")
        except requests.RequestException as req_err:
            raise HTTPException(status_code=500, detail=f"500: {str(req_err)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"500: {str(e)}")

async def get_video_duration(file_path: str) -> float:
    """Extracts the duration of a video file."""
    try:
        clip = VideoFileClip(file_path)
        duration = clip.duration  # Duration in seconds
        clip.close()
        return duration
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting video duration: {str(e)}")

