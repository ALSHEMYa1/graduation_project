"""Basic API tests for the backend service."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)


def test_root_endpoint():
    """Test that the root endpoint returns 404 (no root route)."""
    response = client.get("/")
    assert response.status_code == 404


def test_register_invalid():
    """Test registration with missing data."""
    response = client.post("/register", json={})
    assert response.status_code == 422


def test_login_invalid():
    """Test login with wrong credentials."""
    response = client.post("/token", data={
        "username": "nonexistent@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "detail" in response.json()


def test_cors_headers():
    """Test CORS headers are present."""
    response = client.options("/")
    assert response.status_code == 404


def test_forgot_password():
    """Test forgot password endpoint returns success."""
    response = client.post("/forgot-password", json={"email": "test@example.com"})
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_users_me_unauthorized():
    """Test /users/me without token returns 401."""
    response = client.get("/users/me")
    assert response.status_code == 401


def test_files_unauthorized():
    """Test /files without token returns 401."""
    response = client.get("/files")
    assert response.status_code == 401


def test_admin_dashboard_unauthorized():
    """Test admin dashboard without token returns 401."""
    response = client.get("/admin/dashboard")
    assert response.status_code == 401
