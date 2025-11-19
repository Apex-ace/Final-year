from fastapi import APIRouter, Query
from services.supabase_client import supabase

router = APIRouter()

@router.get("/browse")
def browse_users(
    q: str = Query("", description="Search query"),
    skill: str = Query("", description="Filter by skill")
):
    query = supabase.table("profiles").select("*")

    if q:
        query = query.ilike("full_name", f"%{q}%")

    if skill:
        query = query.contains("skills_offered", [skill])

    resp = query.execute()

    return {"ok": True, "results": resp.data}
