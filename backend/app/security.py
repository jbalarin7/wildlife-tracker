import hashlib
import hmac
import os
import secrets
import sys
import warnings
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

SECRET_KEY = os.getenv("WILDLIFE_SECRET_KEY", "dev-secret-change-me")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

if SECRET_KEY == "dev-secret-change-me":
    warnings.warn(
        "\n[wildlife-tracker] WARNING: WILDLIFE_SECRET_KEY is using the insecure default value.\n"
        "  Set the WILDLIFE_SECRET_KEY environment variable before deploying to production.\n",
        RuntimeWarning,
        stacklevel=1,
    )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200_000)
    return f"{salt.hex()}:{hashed.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    salt_hex, hash_hex = password_hash.split(":")
    check = hash_password(password, bytes.fromhex(salt_hex)).split(":")[1]
    return hmac.compare_digest(check, hash_hex)


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def auth_token_for_user(user_id: int) -> str:
    """Create a signed JWT with a 7-day expiry."""
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=TOKEN_EXPIRE_DAYS)).timestamp()),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def parse_auth_token(token: str) -> int | None:
    """Decode and validate a JWT; return the user_id or None on failure."""
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(data["sub"])
    except (JWTError, KeyError, ValueError):
        return None


def expires_in(hours: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
