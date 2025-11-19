from fastapi import APIRouter, Depends, HTTPException
from services.supabase_client import supabase
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = ""
    username: Optional[str] = ""
    bio: Optional[str] = ""
    city: Optional[str] = ""
    country: Optional[str] = ""
    skills_offered: Optional[List[str]] = []
    skills_wanted: Optional[List[str]] = []
    profile_image_url: Optional[str] = ""

@router.get("/me")
def get_my_profile(current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.id

    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

    return {
        "ok": True,
        "profile": {
            "id": user.id,
            "email": user.email,
            **(profile.data or {})
        }
    }

# --- ADDED THIS ENDPOINT ---
@router.get("/{user_id}")
def get_public_profile(user_id: str):
    """
    Fetch a public profile by ID. No auth required to view.
    """
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    
    if not profile.data:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "ok": True,
        "profile": profile.data
    }
# ---------------------------

@router.put("/me")
def update_my_profile(data: ProfileUpdate, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.id

    payload = {
        "id": user_id,
        "full_name": data.full_name,
        "username": data.username,
        "bio": data.bio,
        "city": data.city,
        "country": data.country,
        "skills_offered": data.skills_offered,
        "skills_wanted": data.skills_wanted,
        "profile_image_url": data.profile_image_url
    }

    res = supabase.table("profiles").upsert(payload).execute()
    return {"ok": True, "profile": res.data}