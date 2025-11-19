from fastapi import APIRouter, Depends, Header, HTTPException
from typing import Optional
from services.supabase_client import get_user_from_token

router = APIRouter()


def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Extracts 'Bearer <token>' and validates using Supabase Auth.
    Returns: {"access_token": "<jwt>", "user": <SupabaseUser>}
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")

    token = authorization.split(" ", 1)[1].strip()

    user = get_user_from_token(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"access_token": token, "user": user}


@router.get("/me")
def me(current=Depends(get_current_user)):
    """
    Returns authenticated Supabase user.
    """
    return {"ok": True, "user": {
        "id": current["user"].id,
        "email": current["user"].email
    }}
