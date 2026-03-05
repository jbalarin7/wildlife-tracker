from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr

from .database import get_connection, init_db
from .security import (
    auth_token_for_user,
    expires_in,
    generate_token,
    hash_password,
    now_iso,
    parse_auth_token,
    verify_password,
)

app = FastAPI(title="Wildlife Tracker API", version="0.2.0")
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


@app.on_event("startup")
def startup() -> None:
    init_db()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def get_current_user_id(authorization: Optional[str] = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user_id = parse_auth_token(authorization.replace("Bearer ", "", 1))
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must have at least 8 characters")


@app.post("/auth/register")
def register(payload: RegisterRequest):
    _validate_password(payload.password)
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (payload.email.lower(), hash_password(payload.password), now_iso()),
        )
    except Exception:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")

    user_id = cur.lastrowid
    token = generate_token()
    conn.execute(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user_id, token, expires_in(24)),
    )
    conn.commit()
    conn.close()

    verification_link = f"/auth/verify-email?token={token}"
    return {"message": "User registered. Verify email.", "verification_link": verification_link}


@app.get("/auth/verify-email")
def verify_email(token: str):
    conn = get_connection()
    row = conn.execute(
        """
        SELECT id, user_id, expires_at, used_at
        FROM email_verification_tokens
        WHERE token = ?
        """,
        (token,),
    ).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")
    if row["used_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Token already used")
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        conn.close()
        raise HTTPException(status_code=400, detail="Token expired")

    conn.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (row["user_id"],))
    conn.execute("UPDATE email_verification_tokens SET used_at = ? WHERE id = ?", (now_iso(), row["id"]))
    conn.commit()
    conn.close()
    return {"message": "Email verified"}


@app.post("/auth/login")
def login(payload: LoginRequest):
    conn = get_connection()
    user = conn.execute(
        "SELECT id, password_hash, is_verified FROM users WHERE email = ?",
        (payload.email.lower(),),
    ).fetchone()
    conn.close()

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user["is_verified"]:
        raise HTTPException(status_code=403, detail="Verify email first")

    return {"access_token": auth_token_for_user(int(user["id"]))}


@app.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    conn = get_connection()
    user = conn.execute("SELECT id FROM users WHERE email = ?", (payload.email.lower(),)).fetchone()
    if not user:
        conn.close()
        return {"message": "If your email exists, a reset link was generated."}

    token = generate_token()
    conn.execute(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?)",
        (user["id"], token, expires_in(1), now_iso()),
    )
    conn.commit()
    conn.close()
    return {
        "message": "If your email exists, a reset link was generated.",
        "reset_link": f"/auth/reset-password?token={token}",
    }


@app.post("/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    _validate_password(payload.new_password)
    conn = get_connection()
    row = conn.execute(
        "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?",
        (payload.token,),
    ).fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Token not found")
    if row["used_at"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Token already used")
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(timezone.utc):
        conn.close()
        raise HTTPException(status_code=400, detail="Token expired")

    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(payload.new_password), row["user_id"]))
    conn.execute("UPDATE password_reset_tokens SET used_at = ? WHERE id = ?", (now_iso(), row["id"]))
    conn.commit()
    conn.close()
    return {"message": "Password updated"}


@app.post("/occurrences")
async def create_occurrence(
    category: str = Form(...),
    common_name: str = Form(...),
    scientific_name: Optional[str] = Form(default=None),
    observed_at: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: Optional[str] = Form(default=None),
    images: list[UploadFile] = File(default=[]),
    user_id: int = Depends(get_current_user_id),
):
    if category not in {"fauna", "flora"}:
        raise HTTPException(status_code=400, detail="Invalid category")

    conn = get_connection()
    cur = conn.execute(
        """
        INSERT INTO occurrences (
            user_id, category, common_name, scientific_name, observed_at,
            latitude, longitude, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            category,
            common_name,
            scientific_name,
            observed_at,
            latitude,
            longitude,
            description,
            now_iso(),
        ),
    )
    occurrence_id = cur.lastrowid

    for image in images:
        if image.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
            conn.rollback()
            conn.close()
            raise HTTPException(status_code=400, detail="Unsupported image type")

        data = await image.read()
        if len(data) > MAX_IMAGE_SIZE_BYTES:
            conn.rollback()
            conn.close()
            raise HTTPException(status_code=400, detail="Image too large (max 5MB)")

        suffix = Path(image.filename or "upload.jpg").suffix or ".jpg"
        file_name = f"occ_{occurrence_id}_{generate_token()[:8]}{suffix}"
        save_path = UPLOAD_DIR / file_name
        save_path.write_bytes(data)
        conn.execute(
            "INSERT INTO occurrence_images (occurrence_id, file_path, created_at) VALUES (?, ?, ?)",
            (occurrence_id, f"/uploads/{file_name}", now_iso()),
        )

    conn.commit()
    conn.close()
    return {"id": occurrence_id, "message": "Occurrence created"}


@app.get("/occurrences")
def list_occurrences(
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    conn = get_connection()
    base = """
    SELECT o.*, u.email,
      (SELECT json_group_array(file_path) FROM occurrence_images i WHERE i.occurrence_id = o.id) AS images
    FROM occurrences o
    JOIN users u ON u.id = o.user_id
    WHERE 1=1
    """
    params: list[object] = []
    if category:
        base += " AND o.category = ?"
        params.append(category)
    if q:
        base += " AND (o.common_name LIKE ? OR IFNULL(o.scientific_name,'') LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%"])

    params.extend([limit, offset])
    rows = [
        dict(r)
        for r in conn.execute(base + " ORDER BY o.created_at DESC LIMIT ? OFFSET ?", params).fetchall()
    ]
    conn.close()
    return rows


@app.get("/map/geojson")
def map_geojson(
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lng: Optional[float] = None,
    max_lng: Optional[float] = None,
):
    conn = get_connection()
    query = "SELECT id, category, common_name, latitude, longitude, observed_at FROM occurrences WHERE 1=1"
    params: list[object] = []
    if None not in (min_lat, max_lat, min_lng, max_lng):
        query += " AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?"
        params.extend([min_lat, max_lat, min_lng, max_lng])

    rows = conn.execute(query, params).fetchall()
    conn.close()

    features = [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["longitude"], r["latitude"]]},
            "properties": {
                "id": r["id"],
                "category": r["category"],
                "common_name": r["common_name"],
                "observed_at": r["observed_at"],
            },
        }
        for r in rows
    ]
    return {"type": "FeatureCollection", "features": features}


app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
