"""
app/core/auth.py — FastAPI dependencies for JWT extraction and user identity.

Extracts the Bearer token from the Authorization header and decodes the
JWT payload to retrieve the authenticated user's UUID (sub claim).
The raw token is also passed to the Supabase client so PostgREST RLS
policies see the correct auth.uid().
"""

import base64
import json
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer()   # auto_error=True (default) — FastAPI registers this in OpenAPI schema


def get_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    FastAPI dependency — returns the raw Supabase JWT from the
    Authorization: Bearer <token> header.

    HTTPBearer raises HTTP 403 automatically if the header is missing.
    """
    return credentials.credentials


def _decode_jwt_payload(token: str) -> dict:
    """
    Base64url-decode the JWT payload section without signature verification.
    Verification is handled by Supabase PostgREST; we only need the sub claim.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Not a valid JWT (expected 3 segments)")
        # Add padding so Python's base64 is happy
        padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
        payload_bytes = base64.urlsafe_b64decode(padded)
        return json.loads(payload_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not decode JWT payload: {exc}",
        ) from exc


def get_current_user_id(token: str = Depends(get_token)) -> UUID:
    """
    FastAPI dependency — decodes the JWT and returns the user's UUID
    from the `sub` claim. Used to explicitly set user_id on database inserts
    so Postgres RLS WITH CHECK policies are satisfied.
    """
    payload = _decode_jwt_payload(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing 'sub' claim — cannot identify user.",
        )
    try:
        return UUID(sub)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid user ID in token: {sub}",
        ) from exc
