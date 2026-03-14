from pydantic import BaseModel


class SignUpGoogleRequest(BaseModel):
    credential: str  # Google ID token from the client


class GoogleJWT(BaseModel):
    """Subset of claims we need from a verified Google ID token."""

    sub: str  # stable unique Google user ID
    email: str
    name: str
    picture: str  # URL of the user's profile picture, not stored in the database


class KimuPayload(BaseModel):
    """Claims embedded in Kimu's own application JWT. This is the payload that is signed by the server and sent to the client."""

    user_id: str  # UUID as string
    email: str
    name: str
    avatar_url: str


class KimuJWT(KimuPayload):
    """Decoded Kimu JWT (includes the expiration claim)."""

    exp: int
