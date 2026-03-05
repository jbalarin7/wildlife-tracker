from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def setup_function():
    db = Path(__file__).resolve().parent.parent / "wildlife.db"
    if db.exists():
        db.unlink()



def _register_verify_login(email: str, password: str = "secret123") -> str:
    reg = client.post("/auth/register", json={"email": email, "password": password})
    assert reg.status_code == 200
    verify_token = reg.json()["verification_link"].split("token=")[1]
    verify = client.get(f"/auth/verify-email?token={verify_token}")
    assert verify.status_code == 200
    login = client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return login.json()["access_token"]


def test_auth_occurrence_geojson_and_pagination_flow():
    access = _register_verify_login("test@example.com")

    for idx in range(2):
        occ = client.post(
            "/occurrences",
            data={
                "category": "fauna",
                "common_name": f"Onça-pintada-{idx}",
                "observed_at": "2026-01-01T10:00:00+00:00",
                "latitude": "-15.793889",
                "longitude": "-47.882778",
            },
            headers={"Authorization": f"Bearer {access}"},
        )
        assert occ.status_code == 200

    listed = client.get("/occurrences?limit=1&offset=0")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

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
