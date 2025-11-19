# routers/reviews.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from services.supabase_client import supabase
from routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

class ReviewCreate(BaseModel):
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

@router.post("/", summary="Create a review for another user")
def create_review(payload: ReviewCreate, current=Depends(get_current_user)):
    user = current["user"]
    reviewer_id = user.get("id") or (user.get("user") or {}).get("id")
    if not reviewer_id:
        raise HTTPException(status_code=400, detail="Invalid reviewer id")
    if reviewer_id == payload.reviewee_id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    # Optional: check they have a conversation or prior interaction; omitted for simplicity

    # Insert review
    ins = supabase.table("reviews").insert({
        "reviewer_id": reviewer_id,
        "reviewee_id": payload.reviewee_id,
        "rating": payload.rating,
        "comment": payload.comment
    }).execute()
    status = getattr(ins, "status_code", None)
    data = getattr(ins, "data", None) or (ins.json() if hasattr(ins, "json") else None)
    if status not in (200, 201):
        raise HTTPException(status_code=500, detail="Failed to create review")

    # Recompute aggregated rating and count for the reviewee
    agg_resp = supabase.table("reviews").select("rating").eq("reviewee_id", payload.reviewee_id).execute()
    agg_data = getattr(agg_resp, "data", None) or (agg_resp.json() if hasattr(agg_resp, "json") else None) or []
    ratings = [r.get("rating") for r in agg_data if r.get("rating") is not None]
    if ratings:
        avg = sum(ratings) / len(ratings)
        count = len(ratings)
    else:
        avg = 0
        count = 0

    # Update profiles table with new aggregate
    supabase.table("profiles").update({"average_rating": avg, "reviews_count": count, "updated_at": datetime.utcnow().isoformat()}).eq("id", payload.reviewee_id).execute()

    # Return created review
    review = data[0] if isinstance(data, list) and data else data
    return {"ok": True, "review": review, "average_rating": avg, "reviews_count": count}

@router.get("/user/{user_id}", summary="Get reviews for a user")
def get_reviews_for_user(user_id: str, limit: int = 50, offset: int = 0):
    resp = supabase.table("reviews").select("*").eq("reviewee_id", user_id).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    data = getattr(resp, "data", None) or (resp.json() if hasattr(resp, "json") else None) or []
    return {"ok": True, "reviews": data, "count": len(data)}
