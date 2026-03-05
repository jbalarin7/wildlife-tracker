from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def setup_function():
    db = Path(__file__).resolve().parent.parent / "wildlife.db"
    if db.exists():
        db.unlink()


def test_auth_and_occurrence_flow():
    reg = client.post("/auth/register", json={"email": "test@example.com", "password": "secret123"})
    assert reg.status_code == 200
    token = reg.json()["verification_link"].split("token=")[1]

    verify = client.get(f"/auth/verify-email?token={token}")
    assert verify.status_code == 200

    login = client.post("/auth/login", json={"email": "test@example.com", "password": "secret123"})
    assert login.status_code == 200
    access = login.json()["access_token"]

    occ = client.post(
        "/occurrences",
        data={
            "category": "fauna",
            "common_name": "Onça-pintada",
            "observed_at": "2026-01-01T10:00:00+00:00",
            "latitude": "-15.793889",
            "longitude": "-47.882778",
        },
        headers={"Authorization": f"Bearer {access}"},
    )
    assert occ.status_code == 200

    listed = client.get("/occurrences")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    geo = client.get("/map/geojson")
    assert geo.status_code == 200
    assert geo.json()["type"] == "FeatureCollection"
    assert len(geo.json()["features"]) == 1
