from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from routers.auth import get_current_user
from services.supabase_client import supabase

router = APIRouter()

# -------------------------------
# CORRECT SCHEMA MATCHING TABLE
# -------------------------------
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = ""
    bio: Optional[str] = ""
    skills: List[str] = []
    location: Optional[str] = ""
    avatar_url: Optional[str] = ""


# -------------------------------
# GET MY PROFILE
# -------------------------------
@router.get("/me")
def get_my_profile(current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.id

    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

    if result.data:
        return {"ok": True, "profile": result.data}

    # If trigger didn’t create profile yet, return minimal
    return {
        "ok": True,
        "profile": {
            "id": user.id,
            "email": user.email,
            "full_name": "",
            "bio": "",
            "skills": [],
            "location": "",
            "avatar_url": ""
        },
    }


# -------------------------------
# UPDATE MY PROFILE
# -------------------------------
@router.put("/me")
def update_my_profile(data: ProfileUpdate, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.id

    # Build payload matching Supabase table
    db_payload = {
        "id": user_id,    # VERY IMPORTANT for RLS!
        "full_name": data.full_name,
        "bio": data.bio,
        "skills": data.skills,
        "location": data.location,
        "avatar_url": data.avatar_url,
    }

    resp = supabase.table("profiles").upsert(db_payload).execute()

    if resp.error:
        raise HTTPException(500, resp.error.message)

    return {"success": True, "profile": resp.data}
