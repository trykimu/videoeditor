from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth.schema import SessionUser
from db import get_db_pool

_BETTER_AUTH_COOKIE = "better-auth.session_token"


def _extract_session_token_from_cookies(request: Request) -> str | None:
    """
    Better Auth stores a signed cookie value as "<token>.<signature>".
    Extract the raw token used in the session table.
    """
    raw_cookie_value = request.cookies.get(_BETTER_AUTH_COOKIE)
    if not raw_cookie_value:
        return None

    decoded_cookie = unquote(raw_cookie_value)
    token = decoded_cookie.split(".", 1)[0]
    return token or None

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_current_user(
    request: Request,
) -> SessionUser:
    """
    FastAPI dependency. Reads the BetterAuth session token from the HttpOnly
    cookie and validates it against the session/user tables in Postgres.
    """
    session_token = _extract_session_token_from_cookies(request)
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
