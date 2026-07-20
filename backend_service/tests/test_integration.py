"""Tests against the running backend server.

Run these with the backend server running on port 8000.
"""

import requests

BASE = "http://127.0.0.1:8000"


def test_health():
    """Server should be reachable."""
    try:
        r = requests.get(f"{BASE}/users/me", timeout=5)
        assert r.status_code == 401  # No auth token
        print("OK: Server reachable, auth required")
    except requests.ConnectionError:
        print("FAIL: Server not running on port 8000")
        raise


def test_register_validation():
    """Register should validate input."""
    r = requests.post(f"{BASE}/register", json={}, timeout=5)
    assert r.status_code == 422
    print("OK: Registration validates input")


def test_login_invalid():
    """Login with wrong credentials returns 401."""
    r = requests.post(f"{BASE}/token", data={
        "username": "test@example.com",
        "password": "wrong"
    }, timeout=5)
    assert r.status_code == 401
    print("OK: Wrong credentials rejected")


def test_forgot_password():
    """Forgot-password should always return success."""
    r = requests.post(f"{BASE}/forgot-password", json={
        "email": "anyone@example.com"
    }, timeout=5)
    assert r.status_code == 200
    assert "message" in r.json()
    print("OK: Forgot password endpoint works")


def test_admin_unauthorized():
    """Admin endpoints require auth."""
    r = requests.get(f"{BASE}/admin/dashboard", timeout=5)
    assert r.status_code == 401
    print("OK: Admin endpoints protected")


if __name__ == "__main__":
    test_health()
    test_register_validation()
    test_login_invalid()
    test_forgot_password()
    test_admin_unauthorized()
    print("\nAll integration tests passed!")
