"""
Pure-logic tests for password hashing and JWT create/decode
(app/core/auth.py) — no DB, no HTTP.
"""
import pytest
from jose import jwt

from app.core.auth import hash_password, verify_password, create_token, decode_token
from app.core.config import settings


def test_password_hash_roundtrip():
    hashed = hash_password("correct horse battery staple")
    assert hashed != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed) is True
    assert verify_password("wrong password", hashed) is False


def test_token_roundtrip_carries_sub_and_role():
    token = create_token("user-123", "DIRECT_USER")
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "DIRECT_USER"
    assert "sa" not in payload


def test_superadmin_token_carries_sa_flag():
    token = create_token("admin-1", "SUPER_ADMIN", sa=True)
    payload = decode_token(token)
    assert payload["sa"] is True


def test_token_embeds_permissions_as_nav_hint_only():
    # create_token's own docstring/comment: this claim is a frontend-nav
    # hint the backend never trusts as an authorization decision — see
    # app/core/permissions.py::require_permission re-querying the DB instead.
    token = create_token("admin-1", "ADMIN", permissions=["users.view"])
    payload = decode_token(token)
    assert payload["permissions"] == ["users.view"]


def test_decode_rejects_tampered_token():
    # Flip a character in the middle of the payload segment, not the very
    # last character of the token: base64url's final character can carry
    # unused padding bits, so some last-char swaps decode to the identical
    # signature bytes and the tamper goes undetected — a false negative in
    # the test, not a bug in decode_token.
    token = create_token("user-123", "DIRECT_USER")
    header, payload, signature = token.split(".")
    mid = len(payload) // 2
    flipped_char = "A" if payload[mid] != "A" else "B"
    tampered_payload = payload[:mid] + flipped_char + payload[mid + 1:]
    tampered = ".".join([header, tampered_payload, signature])
    with pytest.raises(Exception):
        decode_token(tampered)


def test_decode_rejects_token_signed_with_wrong_secret():
    forged = jwt.encode({"sub": "attacker", "role": "SUPER_ADMIN"}, "wrong-secret", algorithm=settings.jwt_algorithm)
    with pytest.raises(Exception):
        decode_token(forged)
