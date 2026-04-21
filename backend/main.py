from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# because env should be loaded before importing the routes. is it a hack? idts.
from ai.routes import router as ai_router  # noqa: E402
from api.routes import router as api_router  # noqa: E402
from auth.routes import router as auth_router  # noqa: E402

app = FastAPI()

_ALLOWED_ORIGINS = [
    "https://trykimu.com",
    "http://localhost:8080",  # this is a lil finnicky but it works for now. we will move to an env based permanent solution later.
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/beep")
async def beep() -> dict:
    return {"message": "boop"}


app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
