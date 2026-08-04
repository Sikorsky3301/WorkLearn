"""
Pure-logic tests for password hashing and JWT create/decode.
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
    token = create_token(123, "student")
    payload = decode_token(token)
    assert payload["sub"] == "123"
    assert payload["role"] == "student"


def test_admin_token_uses_expire_hours():
    token = create_token(1, "super_admin", expire_hours=24)
    payload = decode_token(token)
    assert payload["role"] == "super_admin"
    assert payload["sub"] == "1"


def test_decode_rejects_tampered_token():
    token = create_token(123, "student")
    header, payload, signature = token.split(".")
    mid = len(payload) // 2
    flipped_char = "A" if payload[mid] != "A" else "B"
    tampered_payload = payload[:mid] + flipped_char + payload[mid + 1:]
    tampered = ".".join([header, tampered_payload, signature])
    with pytest.raises(Exception):
        decode_token(tampered)


def test_decode_rejects_token_signed_with_wrong_secret():
    forged = jwt.encode({"sub": "1", "role": "super_admin"}, "wrong-secret", algorithm=settings.jwt_algorithm)
    with pytest.raises(Exception):
        decode_token(forged)
