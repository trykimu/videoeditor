import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

from schema import FunctionCallResponse

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = FastAPI()
gemini_api = genai.Client(api_key=GEMINI_API_KEY)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Message(BaseModel):
    message: str


@app.post("/ai")
async def process_ai_message(request: Message):
    print(FunctionCallResponse)
    try:
        response = gemini_api.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"You are a helpful assistant that is good at video editing. You are given a list of functions from which you should call the most appropriate one to help the user. Return the structured output. The user's message is: {request.message}",
            config={
                "response_mime_type": "application/json",
                "response_schema": FunctionCallResponse,
            }
        )
        print(response)

        return {"response": f"Received message: {response}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=3000)
