from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from services.supabase_client import supabase
from routers.auth import get_current_user

router = APIRouter()

# --- Schemas ---
class SkillCreate(BaseModel):
    name: str

class UserSkillsUpdate(BaseModel):
    skills_offered: Optional[List[str]] = []
    skills_wanted: Optional[List[str]] = []

# --- Endpoints ---

# ✅ FIX: Router handles both /skills/ and /skills
@router.get("/", summary="List all skills")
@router.get("", summary="List all skills (no slash)", include_in_schema=False)
def list_skills(q: Optional[str] = Query(None, description="Search skills by name")):
    query = supabase.table("skills").select("*")
    if q:
        query = query.ilike("name", f"%{q}%")
    resp = query.execute()
    data = getattr(resp, "data", None) or (resp.json() if hasattr(resp, "json") else None)
    return {"ok": True, "skills": data or []}

@router.post("/", summary="Create a skill")
def create_skill(payload: SkillCreate):
    resp = supabase.table("skills").upsert({"name": payload.name}).execute()
    status = getattr(resp, "status_code", None)
    data = getattr(resp, "data", None) or (resp.json() if hasattr(resp, "json") else None)
    if status not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to create skill")
    return {"ok": True, "skill": data}

@router.post("/me", summary="Set user skills (offered / wanted)")
def set_user_skills(payload: UserSkillsUpdate, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user id")

    # This function handles creating skills if they don't exist
    def ensure_skills(names):
        if not names: return []
        skill_ids = []
        for name in names:
            supabase.table("skills").upsert({"name": name}).execute()
            sel = supabase.table("skills").select("id").eq("name", name).single().execute()
            row = getattr(sel, "data", None) or (sel.json() if hasattr(sel, "json") else None)
            if row:
                skill_ids.append(row.get("id"))
        return skill_ids

    offered_ids = ensure_skills(payload.skills_offered or [])
    wanted_ids = ensure_skills(payload.skills_wanted or [])

    # Update profile with skill names
    supabase.table("profiles").upsert({
        "id": user_id,
        "skills_offered": payload.skills_offered,
        "skills_wanted": payload.skills_wanted
    }).execute()

    return {"ok": True, "offered_count": len(offered_ids), "wanted_count": len(wanted_ids)}