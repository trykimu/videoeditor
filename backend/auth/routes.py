import os

import asyncpg  # type: ignore[import-untyped]
from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from auth.schema import KimuJWT, KimuPayload, SignUpGoogleRequest
from auth.service import (
    COOKIE_MAX_AGE,
    COOKIE_NAME,
    generate_kimu_jwt,
    verify_google_id_token,
    verify_kimu_jwt,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None:
        raise ValueError(f"{name} is not set")
    return value


GOOGLE_CLIENT_ID: str = require_env("VITE_GOOGLE_CLIENT_ID")
JWT_SECRET: str = require_env("JWT_SECRET")
DATABASE_URL: str = require_env("DATABASE_URL")

_pool: asyncpg.Pool | None = None


async def get_db_pool() -> asyncpg.Pool:
    """
    Return the shared asyncpg connection pool, creating it on first call.
    """
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL)
    return _pool


async def get_current_user(
    kimu_session: str = Cookie(alias=COOKIE_NAME),
) -> KimuJWT:
    """
    FastAPI dependency. Reads the session JWT from the HttpOnly cookie.
    """
    print("kimu_session", kimu_session)
    try:
        return verify_kimu_jwt(kimu_session, JWT_SECRET)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


@router.post("/google")
async def google_sign_in(body: SignUpGoogleRequest) -> JSONResponse:
    """
    Verify the Google ID token, upsert the user, return user info and
    set an HttpOnly session cookie with the Kimu JWT.
    """
    # 1. Verify the Google credential
    try:
        google_user = verify_google_id_token(body.credential, GOOGLE_CLIENT_ID)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {exc}",
        ) from exc

    # 2. Upsert user + identity in Postgres
    pool = await get_db_pool()
    async with pool.acquire() as conn, conn.transaction():
        row = await conn.fetchrow(
            """
            SELECT u.id, u.email, u.name
            FROM user_identities ui
            JOIN users u ON u.id = ui.user_id
            WHERE ui.provider = $1 AND ui.provider_sub = $2
            """,
            "google",
            google_user.sub,
        )

        if row is None:
            # Create or reuse the user row by email, then link Google identity.
            user_row = await conn.fetchrow(
                """
                INSERT INTO users (email, name)
                VALUES ($1, $2)
                ON CONFLICT (email)
                DO NOTHING
                RETURNING id, email, name
                """,
                google_user.email,
                google_user.name,
            )

            if user_row is None:
                user_row = await conn.fetchrow(
                    """
                    SELECT id, email, name
                    FROM users
                    WHERE email = $1
                    """,
                    google_user.email,
                )
                if user_row is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to create or fetch user",
                    )

            await conn.execute(
                """
                INSERT INTO user_identities (user_id, provider, provider_sub)
                VALUES ($1, $2, $3)
                ON CONFLICT (provider, provider_sub) DO NOTHING
                """,
                user_row["id"],
                "google",
                google_user.sub,
            )

            row = await conn.fetchrow(
                """
                SELECT u.id, u.email, u.name
                FROM user_identities ui
                JOIN users u ON u.id = ui.user_id
                WHERE ui.provider = $1 AND ui.provider_sub = $2
                """,
                "google",
                google_user.sub,
            )

        if row is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create or fetch user identity",
            )

        user_id = str(row["id"])
        user_email = str(row["email"])
        user_name = str(row["name"])

    # 3. Generate Kimu JWT
    payload = KimuPayload(
        user_id=user_id,
        email=user_email,
        name=user_name,
        avatar_url=google_user.picture,
    )
    token = generate_kimu_jwt(payload, JWT_SECRET)

    # 4. Build response with HttpOnly cookie
    body_data = KimuPayload(
        user_id=user_id,
        email=user_email,
        name=user_name,
        avatar_url=google_user.picture,
    )
    response = JSONResponse(content=body_data.model_dump())
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/me", response_model=KimuPayload)
async def get_me(user: KimuJWT = Depends(get_current_user)) -> KimuPayload:
    """
    Return the current user's profile from the JWT.
    """
    return KimuPayload(
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
    )
