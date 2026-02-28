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
    """Claims embedded in Kimu's own application JWT."""

    user_id: str  # UUID as string
    email: str
    name: str
    avatar_url: str


class KimuJWT(KimuPayload):
    """Decoded Kimu JWT (includes the expiration claim)."""

    exp: int


class AuthResponse(BaseModel):
    """Returned to the client after successful sign-up or sign-in."""

    user_id: str
    email: str
    name: str
    avatar_url: str
