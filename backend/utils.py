import os


def require_env(name: str) -> str:
    """Return env var value; raise if missing or empty."""
    value = os.getenv(name)
    if value is None or value == "":
        raise ValueError(f"{name} is not set")
    return value
