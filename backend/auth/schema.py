from pydantic import BaseModel


class SessionUser(BaseModel):
    """User resolved from a valid BetterAuth session."""

    user_id: str
    email: str
    name: str
    image: str | None = None
