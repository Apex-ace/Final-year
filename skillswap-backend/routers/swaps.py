# skillswap-backend/routers/swaps.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import supabase, supabase_admin
from routers.auth import get_current_user 
from routers.chats import get_uid 

router = APIRouter()

# --- MODELS ---
class SwapDecision(BaseModel):
    request_id: str
    action: str  # "accept" or "reject"

class CreateSwapPayload(BaseModel):
    receiver_id: str
    message: Optional[str] = "Let's swap skills!"

# --- ENDPOINTS ---

@router.post("/request")
def create_swap_request(payload: CreateSwapPayload, current=Depends(get_current_user)):
    user_id = get_uid(current)

    if user_id == payload.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot swap with yourself.")

    # Check if request exists
    existing = supabase.table("swap_requests") \
        .select("*") \
        .eq("sender_id", user_id) \
        .eq("receiver_id", payload.receiver_id) \
        .eq("status", "pending") \
        .execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Request already pending.")

    # Create Request
    res = supabase.table("swap_requests").insert({
        "sender_id": user_id,
        "receiver_id": payload.receiver_id,
        "message": payload.message,
        "status": "pending"
    }).execute()

    return {"ok": True, "request": res.data[0] if res.data else None}

@router.get("/pending")
def get_pending_requests(current=Depends(get_current_user)):
    user_id = get_uid(current)

    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Server config error: Admin client failed.")

    # Use Admin Client to bypass RLS on SELECT for swap_requests
    res = supabase_admin.table("swap_requests") \
        .select("*, sender:profiles!sender_id(*)") \
        .eq("receiver_id", user_id) \
        .eq("status", "pending") \
        .order("created_at", desc=True) \
        .execute()
    
    return {"ok": True, "requests": res.data}

@router.post("/respond")
def respond_to_request(payload: SwapDecision, current=Depends(get_current_user)):
    """
    Accepts a request and uses the Admin Client for a guaranteed Conversation/Message INSERT.
    """
    user_id = get_uid(current)
    
    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Server config error: Admin client failed.")

    # 1. Verify request exists and get data (Admin Client for reliable SELECT)
    req_res = supabase_admin.table("swap_requests") \
        .select("*") \
        .eq("id", payload.request_id) \
        .eq("receiver_id", user_id) \
        .execute()
        
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Request not found")

    request_data = req_res.data[0]
    sender_id = request_data["sender_id"]

    # 2. Update status (use regular client for INSERT/UPDATE)
    new_status = "accepted" if payload.action == "accept" else "rejected"
    
    supabase.table("swap_requests") \
        .update({"status": new_status}) \
        .eq("id", payload.request_id) \
        .execute()
        
    conversation_id = None

    # 3. If Accepted, Create or Retrieve Conversation
    if new_status == "accepted":
        initial_msg = request_data.get("message")
        
        # --- FIXED CRASH: Revert to two separate SELECTs for compatibility ---
        # Check 1: Am I p1 and they p2?
        c1 = supabase_admin.table("conversations").select("*") \
            .eq("participant1_id", user_id) \
            .eq("participant2_id", sender_id) \
            .execute()
            
        # Check 2: Am I p2 and they p1?
        c2 = supabase_admin.table("conversations").select("*") \
            .eq("participant1_id", sender_id) \
            .eq("participant2_id", user_id) \
            .execute()
            
        is_new_conversation = False

        if c1.data:
            conversation_id = c1.data[0]["id"]
        elif c2.data:
            conversation_id = c2.data[0]["id"]
        else:
            # Create NEW conversation (Admin Client)
            ins_conv = supabase_admin.table("conversations").insert({
                "participant1_id": user_id,
                "participant2_id": sender_id
            }).execute()
            
            if ins_conv.data:
                conversation_id = ins_conv.data[0]["id"]
                is_new_conversation = True

        # 4. Automatically insert the initial message (Admin Client)
        if is_new_conversation and initial_msg and conversation_id:
            supabase_admin.table("messages").insert({
                "conversation_id": conversation_id,
                "sender_id": sender_id, 
                "content": initial_msg
            }).execute()

    return {
        "ok": True, 
        "status": new_status, 
        "conversation_id": conversation_id
    }