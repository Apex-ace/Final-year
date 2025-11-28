from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from routers.auth import get_current_user
from routers.chats import get_uid

router = APIRouter()

class WorkCreate(BaseModel):
    receiver_id: str
    work_link: str
    note: Optional[str] = ""

@router.post("/")
def submit_work(payload: WorkCreate, current=Depends(get_current_user)):
    user_id = get_uid(current)

    res = supabase.table("work_submissions").insert({
        "sender_id": user_id,
        "receiver_id": payload.receiver_id,
        "work_link": payload.work_link,
        "note": payload.note
    }).execute()

    return {"ok": True, "work": res.data[0] if res.data else None}


@router.get("/my")
def my_work(current=Depends(get_current_user)):
    user_id = get_uid(current)

    sent = supabase.table("work_submissions") \
        .select("*, receiver:profiles!receiver_id(full_name,profile_image_url)") \
        .eq("sender_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    recv = supabase.table("work_submissions") \
        .select("*, sender:profiles!sender_id(full_name,profile_image_url)") \
        .eq("receiver_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    return {
        "ok": True,
        "sent": sent.data or [],
        "received": recv.data or []
    }
