import datetime

import jwt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from auth.schema import GoogleJWT, KimuJWT, KimuPayload

COOKIE_NAME = "kimu_session"
COOKIE_MAX_AGE = 30 * 24 * 60 * 60  # 30 days in seconds


def verify_google_id_token(token: str, client_id: str) -> GoogleJWT:
    """Verify a Google ID token and return the decoded claims.

    Uses google-auth which handles JWKS fetching, key rotation, signature
    verification, and iss/aud/exp validation internally.

    Raises ValueError on any verification failure.
    """
    request = google_requests.Request()

    id_info: dict[str, object] = id_token.verify_oauth2_token(
        token, request, audience=client_id
    )

    issuer = id_info.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise ValueError(f"Invalid issuer: {issuer}")

    return GoogleJWT(
        sub=str(id_info["sub"]),
        email=str(id_info["email"]),
        name=str(id_info["name"]),
        picture=str(id_info["picture"]),
    )


def generate_kimu_jwt(payload: KimuPayload, secret_key: str) -> str:
    """Generate a signed HS256 JWT for Kimu sessions."""
    expiration = (
        datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=30)
    )  # TODO: this is a very basic mvp ship. we need to migrate to a better solution with token rotation.

    token: str = jwt.encode(
        {
            "user_id": payload.user_id,
            "email": payload.email,
            "name": payload.name,
            "avatar_url": payload.avatar_url,
            "exp": expiration,
        },
        secret_key,
        algorithm="HS256",
    )
    return token


def verify_kimu_jwt(token: str, secret_key: str) -> KimuJWT:
    """Decode and verify a Kimu application JWT.

    Raises jwt.ExpiredSignatureError if the token is expired.
    Raises jwt.InvalidTokenError for any other verification failure.
    """
    decoded: dict[str, object] = jwt.decode(token, secret_key, algorithms=["HS256"])
    raw_exp = decoded["exp"]
    if not isinstance(raw_exp, int):
        raise jwt.InvalidTokenError("Missing or invalid exp claim")
    return KimuJWT(
        user_id=str(decoded["user_id"]),
        email=str(decoded["email"]),
        name=str(decoded["name"]),
        avatar_url=str(decoded["avatar_url"]),
        exp=raw_exp,
    )
