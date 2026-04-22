# routers/reviews.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.supabase_client import supabase_admin as supabase
from routers.auth import get_current_user

router = APIRouter()


class ReviewCreate(BaseModel):
    reviewee_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


def extract_user_id(current):
    user = current["user"]

    if hasattr(user, "id"):
        return user.id

    if isinstance(user, dict):
        return user.get("id") or (user.get("user") or {}).get("id")

    return None


@router.post("/", summary="Create or update a review for another user")
def create_or_update_review(payload: ReviewCreate, current=Depends(get_current_user)):
    try:
        if supabase is None:
            raise HTTPException(status_code=500, detail="Admin client not initialized")

        reviewer_id = extract_user_id(current)

        if not reviewer_id:
            raise HTTPException(status_code=400, detail="Invalid reviewer id")

        if reviewer_id == payload.reviewee_id:
            raise HTTPException(status_code=400, detail="Cannot review yourself")

        existing_resp = (
            supabase.table("reviews")
            .select("*")
            .eq("reviewer_id", reviewer_id)
            .eq("reviewee_id", payload.reviewee_id)
            .execute()
        )
        existing = getattr(existing_resp, "data", None) or []

        if existing:
            review_id = existing[0]["id"]
            upd = (
                supabase.table("reviews")
                .update({
                    "rating": payload.rating,
                    "comment": payload.comment
                })
                .eq("id", review_id)
                .execute()
            )
            data = getattr(upd, "data", None) or []
            review = data[0] if data else existing[0]
        else:
            ins = (
                supabase.table("reviews")
                .insert({
                    "reviewer_id": reviewer_id,
                    "reviewee_id": payload.reviewee_id,
                    "rating": payload.rating,
                    "comment": payload.comment
                })
                .execute()
            )
            data = getattr(ins, "data", None) or []
            if not data:
                raise HTTPException(status_code=500, detail="Failed to create review")
            review = data[0]

        agg_resp = (
            supabase.table("reviews")
            .select("rating")
            .eq("reviewee_id", payload.reviewee_id)
            .execute()
        )
        agg_data = getattr(agg_resp, "data", None) or []

        ratings = [r.get("rating") for r in agg_data if r.get("rating") is not None]
        avg = (sum(ratings) / len(ratings)) if ratings else 0
        count = len(ratings)

        supabase.table("profiles").update({
            "average_rating": round(avg, 2),
            "reviews_count": count
        }).eq("id", payload.reviewee_id).execute()

        return {
            "ok": True,
            "review": review,
            "average_rating": round(avg, 2),
            "reviews_count": count
        }

    except HTTPException:
        raise
    except Exception as e:
        print("POST /reviews error:", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create/update review: {str(e)}")


@router.get("/user/{user_id}", summary="Get reviews for a user")
def get_reviews_for_user(user_id: str, limit: int = 50, offset: int = 0):
    try:
        if supabase is None:
            raise HTTPException(status_code=500, detail="Admin client not initialized")

        resp = (
            supabase.table("reviews")
            .select("*")
            .eq("reviewee_id", user_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        data = getattr(resp, "data", None) or []
        return {"ok": True, "reviews": data, "count": len(data)}

    except HTTPException:
        raise
    except Exception as e:
        print("GET /reviews/user error:", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to fetch reviews: {str(e)}")