# skillswap-backend/routers/chats.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List
import json

from services.supabase_client import supabase, supabase_admin
from routers.auth import get_current_user

router = APIRouter()

# ------------------------------------------------------------
# CONNECTION MANAGER (Unchanged)
# ------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str):
        await websocket.accept()
        self.rooms.setdefault(room, []).append(websocket)

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.rooms:
            if websocket in self.rooms[room]:
                self.rooms[room].remove(websocket)
            if not self.rooms[room]:
                del self.rooms[room]

    async def broadcast(self, room: str, message: dict):
        if room not in self.rooms:
            return

        for ws in self.rooms[room][:]:
            try:
                await ws.send_text(json.dumps(message))
            except:
                self.disconnect(ws, room)

manager = ConnectionManager()


# ------------------------------------------------------------
# FIXED USER ID EXTRACTOR (Final, Robust Fix)
# ------------------------------------------------------------
def get_uid(current):
    """
    Handles ALL possible structures from your auth system.
    """
    if hasattr(current, "id"):
        return current.id

    if isinstance(current, dict):
        user_obj = current.get("user")
        
        if user_obj and hasattr(user_obj, "id"):
            return user_obj.id

        if "id" in current:
            return current["id"]
        
        if isinstance(user_obj, dict):
             return user_obj.get("id")

    raise HTTPException(401, "Unable to extract user ID")


# ------------------------------------------------------------
# WEBSOCKET CHAT ENDPOINT (Uses Admin for message insert)
# ------------------------------------------------------------
@router.websocket("/ws/{conversation_id}")
async def chat_ws(websocket: WebSocket, conversation_id: str):
    user_id = websocket.query_params.get("user_id")

    if not user_id:
        await websocket.close(code=4001, reason="User ID required")
        return

    await manager.connect(websocket, conversation_id)

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            content = data.get("content")
            if not content:
                continue

            msg = {
                "conversation_id": conversation_id,
                "sender_id": user_id,
                "content": content,
            }

            if supabase_admin is None:
                 print("ERROR: Admin client not available for WS message insert.")
                 continue

            saved = (
                supabase_admin.table("messages")
                .insert(msg)
                .select("*")
                .single()
                .execute()
            )

            if saved.data:
                await manager.broadcast(conversation_id, saved.data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        manager.disconnect(websocket, conversation_id)


# ------------------------------------------------------------
# GET ALL CONVERSATIONS (RLS BYPASS)
# ------------------------------------------------------------
@router.get("/")
def list_conversations(current=Depends(get_current_user)):
    user_id = get_uid(current)
    
    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Server configuration error: Admin client failed to initialize.")
        
    # 1. Use supabase_admin for conversation lookup
    c1 = supabase_admin.table("conversations").select("*").eq("participant1_id", user_id).execute()
    c2 = supabase_admin.table("conversations").select("*").eq("participant2_id", user_id).execute()

    raw = (c1.data or []) + (c2.data or [])
    seen = set()
    convs = []

    for c in raw:
        if c["id"] not in seen:
            seen.add(c["id"])
            convs.append(c)

    if not convs:
        return {"ok": True, "conversations": []}

    # Get partner profiles
    partner_ids = list({
        c["participant2_id"] if c["participant1_id"] == user_id else c["participant1_id"]
        for c in convs
    })

    # 2. Use supabase_admin for profile lookup
    profile_map = {
        p["id"]: p
        for p in (
            supabase_admin.table("profiles")
            .select("id,full_name,username,profile_image_url")
            .in_("id", partner_ids)
            .execute().data or []
        )
    }

    # Attach partner info
    for conv in convs:
        partner = (
            conv["participant2_id"]
            if conv["participant1_id"] == user_id
            else conv["participant1_id"]
        )
        conv["partner"] = profile_map.get(partner, {})

    return {"ok": True, "conversations": convs}


# ------------------------------------------------------------
# GET SINGLE CONVERSATION DETAILS (RLS BYPASS)
# ------------------------------------------------------------
@router.get("/{conv_id}")
def get_conversation(conv_id: str, current=Depends(get_current_user)):
    user_id = get_uid(current)

    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Server configuration error: Admin client failed to initialize.")

    # 1. Look up conversation (Admin Client)
    conv_resp = (
        supabase_admin.table("conversations")
        .select("*")
        .eq("id", conv_id)
        .single()
        .execute()
    )
    
    if not conv_resp.data:
        raise HTTPException(404, "Conversation not found")

    conv = conv_resp.data

    if user_id not in [conv["participant1_id"], conv["participant2_id"]]:
        raise HTTPException(403, "Forbidden")

    # 2. Look up partner profile (Admin Client)
    partner_id = (
        conv["participant2_id"]
        if conv["participant1_id"] == user_id
        else conv["participant1_id"]
    )

    partner = (
        supabase_admin.table("profiles")
        .select("id,full_name,username,profile_image_url")
        .eq("id", partner_id)
        .single()
        .execute()
    )

    conv["partner"] = partner.data
    return {"ok": True, "conversation": conv}


# ------------------------------------------------------------
# GET LAST 50 MESSAGES (RLS BYPASS)
# ------------------------------------------------------------
@router.get("/{conv_id}/messages")
def get_messages(conv_id: str, current=Depends(get_current_user)):
    user_id = get_uid(current)

    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Server configuration error: Admin client failed to initialize.")

    # 1. Verify user is a participant (Admin Client)
    conv = (
        supabase_admin.table("conversations")
        .select("participant1_id,participant2_id")
        .eq("id", conv_id)
        .single()
        .execute()
    )

    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    if user_id not in [conv.data["participant1_id"], conv.data["participant2_id"]]:
        raise HTTPException(403, "Forbidden")

    # 2. Fetch messages (Admin Client)
    msgs = (
        supabase_admin.table("messages")
        .select("*")
        .eq("conversation_id", conv_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {"ok": True, "messages": msgs.data[::-1]}