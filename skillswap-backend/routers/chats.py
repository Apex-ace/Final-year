from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List
import json

from services.supabase_client import supabase
from routers.auth import get_current_user

router = APIRouter()

# ------------------------------------------------------------
# CONNECTION MANAGER
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
# FIXED USER ID EXTRACTOR (NO ERRORS)
# ------------------------------------------------------------
def get_uid(current):
    """
    Handles ALL possible structures from your auth system:
    ✔ FastAPI User object                   (user.id)
    ✔ Supabase-style dict                   ({"user": {"id": ...}})
    ✔ Dict with direct id                   ({"id": ...})
    """
    # Case: FastAPI returns a User model/class with .id
    if hasattr(current, "id"):
        return current.id

    # Case: dict-like response
    if isinstance(current, dict):
        if "user" in current and isinstance(current["user"], dict):
            return current["user"].get("id")
        if "id" in current:
            return current["id"]

    raise HTTPException(401, "Unable to extract user ID")


# ------------------------------------------------------------
# WEBSOCKET CHAT ENDPOINT
# ------------------------------------------------------------
@router.websocket("/ws/{conversation_id}")
async def chat_ws(websocket: WebSocket, conversation_id: str):
    user_id = websocket.query_params.get("user_id")

    if not user_id:
        await websocket.close(code=4001)
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

            saved = (
                supabase.table("messages")
                .insert(msg)
                .select("*")
                .single()
                .execute()
            )

            if saved.data:
                await manager.broadcast(conversation_id, saved.data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)


# ------------------------------------------------------------
# GET ALL CONVERSATIONS
# ------------------------------------------------------------
@router.get("/")
def list_conversations(current=Depends(get_current_user)):
    user_id = get_uid(current)

    # Get all conv where user is participant1 or participant2
    c1 = supabase.table("conversations").select("*").eq("participant1_id", user_id).execute()
    c2 = supabase.table("conversations").select("*").eq("participant2_id", user_id).execute()

    raw = (c1.data or []) + (c2.data or [])
    seen = set()
    convs = []

    # Remove duplicates
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

    profile_map = {
        p["id"]: p
        for p in (
            supabase.table("profiles")
            .select("id,full_name,username,profile_image_url")
            .in_("id", partner_ids)
            .execute().data or []
        )
    }

    # Attach partner info to each conv
    for conv in convs:
        partner = (
            conv["participant2_id"]
            if conv["participant1_id"] == user_id
            else conv["participant1_id"]
        )
        conv["partner"] = profile_map.get(partner, {})

    return {"ok": True, "conversations": convs}


# ------------------------------------------------------------
# GET SINGLE CONVERSATION DETAILS
# ------------------------------------------------------------
@router.get("/{conv_id}")
def get_conversation(conv_id: str, current=Depends(get_current_user)):
    user_id = get_uid(current)

    conv = (
        supabase.table("conversations")
        .select("*")
        .eq("id", conv_id)
        .single()
        .execute()
    )

    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    conv = conv.data

    if user_id not in [conv["participant1_id"], conv["participant2_id"]]:
        raise HTTPException(403, "Forbidden")

    partner_id = (
        conv["participant2_id"]
        if conv["participant1_id"] == user_id
        else conv["participant1_id"]
    )

    partner = (
        supabase.table("profiles")
        .select("id,full_name,username,profile_image_url")
        .eq("id", partner_id)
        .single()
        .execute()
    )

    conv["partner"] = partner.data
    return {"ok": True, "conversation": conv}


# ------------------------------------------------------------
# GET LAST 50 MESSAGES
# ------------------------------------------------------------
@router.get("/{conv_id}/messages")
def get_messages(conv_id: str, current=Depends(get_current_user)):
    user_id = get_uid(current)

    conv = (
        supabase.table("conversations")
        .select("participant1_id,participant2_id")
        .eq("id", conv_id)
        .single()
        .execute()
    )

    if not conv.data:
        raise HTTPException(404, "Conversation not found")

    if user_id not in [conv.data["participant1_id"], conv.data["participant2_id"]]:
        raise HTTPException(403, "Forbidden")

    msgs = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conv_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    return {"ok": True, "messages": msgs.data[::-1]}
