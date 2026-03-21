from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase, supabase_admin
from routers.auth import get_current_user
from routers.chats import get_uid

router = APIRouter()


# -----------------------------
# MODELS
# -----------------------------
class WorkCreate(BaseModel):
    receiver_id: str
    work_link: str
    note: Optional[str] = ""


# -----------------------------
# SUBMIT WORK (CONNECTED TO CHAT)
# -----------------------------
@router.post("/")
def submit_work(payload: WorkCreate, current=Depends(get_current_user)):
    user_id = get_uid(current)
    receiver_id = payload.receiver_id

    if user_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send work to yourself")

    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Admin client not initialized")

    # -----------------------------
    # 1. SAVE WORK
    # -----------------------------
    res = supabase.table("work_submissions").insert({
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "work_link": payload.work_link,
        "note": payload.note or ""
    }).execute()

    work = res.data[0] if res.data else None

    # -----------------------------
    # 2. FIND OR CREATE CONVERSATION
    # -----------------------------
    c1 = supabase_admin.table("conversations").select("*") \
        .eq("participant1_id", user_id) \
        .eq("participant2_id", receiver_id) \
        .execute()

    c2 = supabase_admin.table("conversations").select("*") \
        .eq("participant1_id", receiver_id) \
        .eq("participant2_id", user_id) \
        .execute()

    conversation_id = None

    if c1.data:
        conversation_id = c1.data[0]["id"]
    elif c2.data:
        conversation_id = c2.data[0]["id"]
    else:
        new_conv = supabase_admin.table("conversations").insert({
            "participant1_id": user_id,
            "participant2_id": receiver_id
        }).execute()

        if not new_conv.data:
            raise HTTPException(status_code=500, detail="Failed to create conversation")

        conversation_id = new_conv.data[0]["id"]

    # -----------------------------
    # 3. SEND MESSAGE TO CHAT (JSON FORMAT ✅)
    # -----------------------------
    message_content = {
        "type": "work",
        "work_link": payload.work_link,
        "note": payload.note or ""
    }

    msg_res = supabase_admin.table("messages").insert({
    "conversation_id": conversation_id,
    "sender_id": user_id,
    "content": {
        "type": "work",
        "link": payload.work_link,
        "note": payload.note or "No note provided"
    }
}).execute()    

    if not msg_res.data:
        print("Warning: message inserted but no response returned")

    # -----------------------------
    # RESPONSE
    # -----------------------------
    return {
        "ok": True,
        "work": work,
        "conversation_id": conversation_id
    }


# -----------------------------
# GET MY WORK
# -----------------------------
@router.get("/my")
def my_work(current=Depends(get_current_user)):
    user_id = get_uid(current)

    sent = supabase.table("work_submissions") \
        .select("*, receiver:profiles!receiver_id(full_name,profile_image_url)") \
        .eq("sender_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    received = supabase.table("work_submissions") \
        .select("*, sender:profiles!sender_id(full_name,profile_image_url)") \
        .eq("receiver_id", user_id) \
        .order("created_at", desc=True) \
        .execute()

    return {
        "ok": True,
        "sent": sent.data or [],
        "received": received.data or []
    }


# -----------------------------
# GET WORKSPACE BETWEEN TWO USERS
# -----------------------------
@router.get("/profile/{profile_id}")
def get_workspace(profile_id: str, current=Depends(get_current_user)):
    user_id = get_uid(current)

    data = supabase.table("work_submissions") \
        .select("*") \
        .or_(
            f"and(sender_id.eq.{user_id},receiver_id.eq.{profile_id}),"
            f"and(sender_id.eq.{profile_id},receiver_id.eq.{user_id})"
        ) \
        .order("created_at", desc=True) \
        .execute()

    return {
        "ok": True,
        "workspace": data.data or []
    }