# routers/extras.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase
from routers.auth import get_current_user

router = APIRouter()

class FavoritePayload(BaseModel):
    favorite_user_id: str

class BlockPayload(BaseModel):
    blocked_user_id: str
    reason: Optional[str] = None  # optional report reason

@router.post("/favorite", summary="Add a user to favorites")
def add_favorite(payload: FavoritePayload, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    if user_id == payload.favorite_user_id:
        raise HTTPException(status_code=400, detail="Cannot favorite yourself")
    # Prevent duplicates: check existing
    q = supabase.table("favorites").select("*").eq("user_id", user_id).eq("favorite_user_id", payload.favorite_user_id).execute()
    existing = getattr(q, "data", None) or (q.json() if hasattr(q, "json") else None) or []
    if existing:
        return {"ok": True, "message": "Already favorited"}
    ins = supabase.table("favorites").insert({"user_id": user_id, "favorite_user_id": payload.favorite_user_id}).execute()
    status = getattr(ins, "status_code", None)
    if status not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to add favorite")
    return {"ok": True}

@router.delete("/favorite/{favorite_user_id}", summary="Remove a user from favorites")
def remove_favorite(favorite_user_id: str, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    supabase.table("favorites").delete().eq("user_id", user_id).eq("favorite_user_id", favorite_user_id).execute()
    return {"ok": True}

@router.get("/favorites", summary="List favorites for current user")
def list_favorites(current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    q = supabase.table("favorites").select("favorite_user_id").eq("user_id", user_id).execute()
    data = getattr(q, "data", None) or (q.json() if hasattr(q, "json") else None) or []
    ids = [r.get("favorite_user_id") for r in data]
    if not ids:
        return {"ok": True, "favorites": []}
    profiles_resp = supabase.table("profiles").select("*").in_("id", ids).execute()
    profiles = getattr(profiles_resp, "data", None) or (profiles_resp.json() if hasattr(profiles_resp, "json") else None) or []
    return {"ok": True, "favorites": profiles}

@router.post("/block", summary="Block/report a user")
def block_user(payload: BlockPayload, current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    if user_id == payload.blocked_user_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    # Prevent duplicate blocks
    q = supabase.table("blocked_users").select("*").eq("blocker_id", user_id).eq("blocked_id", payload.blocked_user_id).execute()
    data = getattr(q, "data", None) or (q.json() if hasattr(q, "json") else None) or []
    if data:
        return {"ok": True, "message": "Already blocked"}
    ins = supabase.table("blocked_users").insert({
        "blocker_id": user_id,
        "blocked_id": payload.blocked_user_id
    }).execute()
    status = getattr(ins, "status_code", None)
    if status not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to block user")
    # You could also store the reason in a report table; omitted for simplicity
    return {"ok": True}

@router.get("/blocked", summary="List users I've blocked")
def list_blocked(current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    q = supabase.table("blocked_users").select("blocked_id, created_at").eq("blocker_id", user_id).execute()
    data = getattr(q, "data", None) or (q.json() if hasattr(q, "json") else None) or []
    ids = [r.get("blocked_id") for r in data]
    if not ids:
        return {"ok": True, "blocked": []}
    profiles_resp = supabase.table("profiles").select("*").in_("id", ids).execute()
    profiles = getattr(profiles_resp, "data", None) or (profiles_resp.json() if hasattr(profiles_resp, "json") else None) or []
    return {"ok": True, "blocked": profiles}

@router.get("/notifications/unread_count", summary="Simple notifications: unread messages count")
def unread_notifications(current=Depends(get_current_user)):
    user = current["user"]
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    # unread messages where receiver is user and is_read is false
    # need to find conversations where user is participant and messages not read by them
    # Simpler: count messages where receiver is user (i.e., conversation where other participant sent msg) and is_read=false
    # Find conversations where user is participant
    convs_resp = supabase.table("conversations").select("id, participant1_id, participant2_id").or_(f"participant1_id.eq.{user_id},participant2_id.eq.{user_id}").execute()
    convs = getattr(convs_resp, "data", None) or (convs_resp.json() if hasattr(convs_resp, "json") else None) or []
    conv_ids = [c.get("id") for c in convs]
    if not conv_ids:
        return {"ok": True, "unread_messages": 0}
    # Count messages in those convs where sender != user_id and is_read = false
    msgs_resp = supabase.table("messages").select("id").in_("conversation_id", conv_ids).eq("is_read", False).neq("sender_id", user_id).execute()
    msgs = getattr(msgs_resp, "data", None) or (msgs_resp.json() if hasattr(msgs_resp, "json") else None) or []
    return {"ok": True, "unread_messages": len(msgs)}
