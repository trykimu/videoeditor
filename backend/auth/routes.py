from fastapi import APIRouter, Cookie, Depends, HTTPException, status

from auth.schema import SessionUser
from db import get_db_pool

_BETTER_AUTH_COOKIE = "better-auth.session_token"

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_current_user(
    session_token: str | None = Cookie(default=None, alias=_BETTER_AUTH_COOKIE),
) -> SessionUser:
    """
    FastAPI dependency. Reads the BetterAuth session token from the HttpOnly
    cookie and validates it against the session/user tables in Postgres.
    """
    if not session_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    pool = await get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.id, u.name, u.email, u.image
            FROM session s
            JOIN "user" u ON u.id = s."userId"
            WHERE s.token = $1 AND s."expiresAt" > now()
            """,
            session_token,
        )

    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    return SessionUser(
        user_id=str(row["id"]),
        email=str(row["email"]),
        name=str(row["name"]),
        image=str(row["image"]) if row["image"] else None,
    )


@router.get("/me", response_model=SessionUser)
async def get_me(user: SessionUser = Depends(get_current_user)) -> SessionUser:
    return user
