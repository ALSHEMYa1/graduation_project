import os
import requests
from fastapi import HTTPException

AI_URL = os.getenv("AI_SERVICE_URL", "http://127.0.0.1:5000")

def call_ai(endpoint: str, data: dict):
    try:
        response = requests.post(f"{AI_URL}/{endpoint}", json=data, timeout=1800)
        if not response.ok:
            detail = response.text[:500] if response.text else f"AI service returned {response.status_code}"
            raise HTTPException(status_code=502, detail=f"AI service error: {detail}")
        return response.json()
    except requests.ConnectionError:
        raise HTTPException(status_code=502, detail="AI service is not available. Make sure the AI service is running on port 5000.")
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="AI service timed out. The request took too long.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error communicating with AI service: {str(e)}")
