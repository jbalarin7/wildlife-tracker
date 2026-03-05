from pathlib import Path

from fastapi.testclient import TestClient

from app.database import init_db
from app.main import app

client = TestClient(app)


def setup_function():
    db = Path(__file__).resolve().parent.parent / "wildlife.db"
    if db.exists():
        db.unlink()
    init_db()  # recreate schema after deletion


def _register_verify_login(email: str, password: str = "secret123") -> str:
    reg = client.post("/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 200
    verify_token = reg.json()["verification_link"].split("token=")[1]
    verify = client.get(f"/auth/verify-email?token={verify_token}")
    assert verify.status_code == 200
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return login.json()["access_token"]


def _create_occurrence(access: str, common_name: str = "Onça-pintada") -> int:
    occ = client.post(
        "/occurrences",
        data={
            "category": "fauna",
            "common_name": common_name,
            "observed_at": "2026-01-01T10:00:00+00:00",
            "latitude": "-15.793889",
            "longitude": "-47.882778",
        },
        headers={"Authorization": f"Bearer {access}"},
    )
    assert occ.status_code == 200
    return occ.json()["id"]


def test_auth_occurrence_geojson_and_pagination_flow():
    access = _register_verify_login("test@example.com")

    for idx in range(2):
        _create_occurrence(access, f"Onça-pintada-{idx}")

    listed = client.get("/occurrences?limit=1&offset=0")
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1
    assert listed.json()["total"] == 2

    # images must already be a list (parsed server-side)
    item = listed.json()["items"][0]
    assert isinstance(item["images"], list)

    geo = client.get(
        "/map/geojson?min_lat=-16&max_lat=-15&min_lng=-48&max_lng=-47"
    )
    assert geo.status_code == 200
    assert geo.json()["type"] == "FeatureCollection"
    assert len(geo.json()["features"]) == 2


def test_password_reset_flow():
    _register_verify_login("reset@example.com", "oldsecret123")

    forgot = client.post("/auth/forgot-password", json={"email": "reset@example.com"})
    assert forgot.status_code == 200
    token = forgot.json()["reset_link"].split("token=")[1]

    reset = client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "newsecret123"},
    )
    assert reset.status_code == 200

    old_login = client.post(
        "/auth/login", json={"email": "reset@example.com", "password": "oldsecret123"}
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login", json={"email": "reset@example.com", "password": "newsecret123"}
    )
    assert new_login.status_code == 200


def test_reject_invalid_image_type():
    access = _register_verify_login("img@example.com")

    response = client.post(
        "/occurrences",
        data={
            "category": "flora",
            "common_name": "Ipê",
            "observed_at": "2026-01-01T10:00:00+00:00",
            "latitude": "-10.0",
            "longitude": "-50.0",
        },
        files={"images": ("malicioso.txt", b"not-an-image", "text/plain")},
        headers={"Authorization": f"Bearer {access}"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported image type"


def test_delete_occurrence_owner_only():
    access_a = _register_verify_login("owner@example.com")
    access_b = _register_verify_login("other@example.com")

    occ_id = _create_occurrence(access_a)

    # Another user cannot delete it
    resp = client.delete(
        f"/occurrences/{occ_id}",
        headers={"Authorization": f"Bearer {access_b}"},
    )
    assert resp.status_code == 403

    # Owner can delete it
    resp = client.delete(
        f"/occurrences/{occ_id}",
        headers={"Authorization": f"Bearer {access_a}"},
    )
    assert resp.status_code == 200

    # Deleted occurrence returns 404
    resp = client.get(f"/occurrences/{occ_id}")
    assert resp.status_code == 404

    # Deleted occurrence does not appear in the list
    listed = client.get("/occurrences")
    assert listed.json()["total"] == 0


def test_change_password():
    access = _register_verify_login("chpwd@example.com", "oldpass123")

    # Wrong current password is rejected
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "wrong-pass", "new_password": "newpass456"},
        headers={"Authorization": f"Bearer {access}"},
    )
    assert resp.status_code == 400

    # Correct current password succeeds
    resp = client.post(
        "/auth/change-password",
        json={"current_password": "oldpass123", "new_password": "newpass456"},
        headers={"Authorization": f"Bearer {access}"},
    )
    assert resp.status_code == 200

    # Old password no longer works
    old_login = client.post(
        "/auth/login", json={"email": "chpwd@example.com", "password": "oldpass123"}
    )
    assert old_login.status_code == 401

    # New password works
    new_login = client.post(
        "/auth/login", json={"email": "chpwd@example.com", "password": "newpass456"}
    )
    assert new_login.status_code == 200


def test_occurrence_images_are_list():
    """Server must return images as a JSON array, never a raw string."""
    access = _register_verify_login("json@example.com")
    occ_id = _create_occurrence(access)

    detail = client.get(f"/occurrences/{occ_id}")
    assert detail.status_code == 200
    assert isinstance(detail.json()["images"], list)
