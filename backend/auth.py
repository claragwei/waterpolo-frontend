import os
from typing import Optional

import jwt
from fastapi import Header, Security, HTTPException
from fastapi.security import APIKeyHeader
from jwt.exceptions import InvalidTokenError

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    key: Optional[str] = Security(api_key_header),
    authorization: Optional[str] = Header(None),
):
    """
    Accepts X-API-Key matching API_KEY, or (when SUPABASE_JWT_SECRET is set)
    Authorization: Bearer <Supabase user JWT> for coach accounts.
    """
    expected = os.getenv("API_KEY")
    if key == expected:
        return key

    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    if jwt_secret and authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        try:
            jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return token
        except InvalidTokenError:
            pass

    raise HTTPException(status_code=403, detail="Invalid or missing API key")
