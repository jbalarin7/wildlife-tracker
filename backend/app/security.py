import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta, timezone

SECRET_KEY = os.getenv("WILDLIFE_SECRET_KEY", "dev-secret-change-me")


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
    payload = f"{user_id}:{int(datetime.now(tz=timezone.utc).timestamp())}"
    sig = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def parse_auth_token(token: str) -> int | None:
    try:
        uid, ts, sig = token.split(":", 2)
        payload = f"{uid}:{ts}"
        expected = hmac.new(SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        if datetime.now(tz=timezone.utc).timestamp() - int(ts) > 60 * 60 * 24 * 7:
            return None
        return int(uid)
    except Exception:
        return None


def expires_in(hours: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
