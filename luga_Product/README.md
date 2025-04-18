# luga_Backend

This repository contains the backend for the LugaAI application
## Technology Stack:
- **Python**
- **FastAPI**
- **MongoDB**
- **Cloudinary**

## Setup Instructions

Follow the steps below to set up the backend locally:

### 1. Clone the repository:
```bash
git clone https://github.com/physical168/luga_Backend.git
```
### 2. Navigate into the backend directory:
```bash
cd LugaAI-backend
```
### 3. Install dependencies:
```bash
pip install -r requirements.txt
```
## 4. Installation and Setup .env file

### 4.1 Download .env file

Download the `.env` file and place it in the root directory of the project.

### 4.2 Project Structure

Ensure your project follows this directory structure:

```bash
LugaAI-backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── voice.py
│   │   ├── video.py
│   │   └── text.py
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   └── models.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── aws.py
│   │   ├── cloudinary.py
│   │   ├── text_service.py
│   │   ├── video_service.py
│   │   └── voice_service.py
│   └── main.py
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```



### 5. Run the application:
```bash
uvicorn app.main:app --reload
```
The app will be available at: http://127.0.0.1:8000

Swagger documentation will be available at: http://127.0.0.1:8000/docs

## API documentation:
## API Endpoints
## 1. Text-to-Speech API

Convert a given text into speech.

- **Method:** POST
- **Endpoint:** `/api/voice/text-to-speech/`

### Parameters:
- `user_id`: User identifier
- `voice_id`: Voice identifier (obtained from list_voice.json)
- `text`: Text to be converted to speech

### Example:

```bash
curl -X 'POST' \\
  'http://127.0.0.1:8000/api/voice/text-to-speech/?user_id=1&voice_id=9BWtsMINqrJLrRacOk9x&text=Hi%20Hamid%20and%20Ruisi' \\
  -H 'accept: application/json' \\
  -d ''
```

## 2. Audio-to-Video API

### 2.1. Upload Video API

Upload a video to the database.

- **Method:** POST
- **Endpoint:** `/api/video/upload-video/`

### Parameters:
- `user_id`: User identifier

### Request Body:
- `video`: Video file to upload (approximately 2 minutes long)

### Example:

```bash
curl -X 'POST' \\
  'http://127.0.0.1:8000/api/video/upload-video/?user_id=1' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: multipart/form-data' \\
  -F 'video=@video.mp4;type=video/mp4'
```

### 2.2. Sync Audio API

Synchronize audio with video.

- **Method:** POST
- **Endpoint:** `/api/video/sync-audio/`

### Parameters:
- `user_id`: User identifier
- `video_id`: Video identifier (obtained from Upload Video API)
- `model`: Sync model version
- `synergize`: Synergize flag

### Request Body:
- `audio`: Audio file to upload (approximately 2 minutes long)

### Example:

```bash
curl -X 'POST' \\
  'http://127.0.0.1:8000/api/video/sync-audio/?user_id=1&video_id=670f0b3b6db82eeb41b8231f&model=sync-1.6.0&synergize=true' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: multipart/form-data' \\
  -F 'audio=@Recording.m4a;type=audio/x-m4a'
```

### 2.3. Get Audio-to-Video Job Status API

Retrieve the status of an Audio-to-Video job.

- **Method:** GET
- **Endpoint:** `/api/video/job/{user_id}/{video_id}`

### Parameters:
- `user_id`: User identifier
- `video_id`: Video identifier (obtained from Upload Video API)

### Example:

```bash
curl -X 'GET' \\
  'http://127.0.0.1:8000/api/video/job/1/670f0b3b6db82eeb41b8231f' \\
  -H 'accept: application/json'
```
## 3. Text Generation API

### 3.1. Text Generation API

Generate text based on a prompt.

- **Method:** POST
- **Endpoint:** `/api/text/generate`

### Request Body:
```json
{
  "prompt": "Enter your prompt here"
}
```

### Example:

```bash
curl -X 'POST' \\
  'http://127.0.0.1:8000/api/text/generate' \\
  -H 'accept: application/json' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "prompt": "Hello guys"
}'
```

### 3.2. Text Generation History API

Retrieve the history of text generation.

- **Method:** GET
- **Endpoint:** `/api/text/history`

No parameters required.

### Example:

```bash
curl -X 'GET' \\
  'http://127.0.0.1:8000/api/text/history' \\
  -H 'accept: application/json'
```






