# routers/recommendations.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Any
from math import isfinite

from services.supabase_client import supabase, supabase_admin
from routers.auth import get_current_user
from routers.chats import get_uid

router = APIRouter()


EXPERIENCE_RANK = {
    "Beginner": 0,
    "Intermediate": 1,
    "Advanced": 2,
}


def normalize_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    return []


def safe_float(value, default=0.0):
    try:
        v = float(value)
        return v if isfinite(v) else default
    except Exception:
        return default


def profile_text(profile: Dict[str, Any]) -> str:
    offered = normalize_list(profile.get("skills_offered"))
    wanted = normalize_list(profile.get("skills_wanted"))
    city = str(profile.get("city") or "").strip().lower()
    country = str(profile.get("country") or "").strip().lower()

    tokens = []
    tokens += [f"offer_{s.lower().replace(' ', '_')}" for s in offered]
    tokens += [f"want_{s.lower().replace(' ', '_')}" for s in wanted]

    if city:
        tokens.append(f"city_{city.replace(' ', '_')}")
    if country:
        tokens.append(f"country_{country.replace(' ', '_')}")

    exp = str(profile.get("experience_level") or "").strip()
    if exp:
        tokens.append(f"exp_{exp}")

    return " ".join(tokens)


def text_similarity(a_tokens: set, b_tokens: set) -> float:
    if not a_tokens or not b_tokens:
        return 0.0
    inter = len(a_tokens.intersection(b_tokens))
    union = len(a_tokens.union(b_tokens))
    return inter / union if union else 0.0


@router.get("/me")
def get_my_recommendations(
    top_n: int = Query(10, ge=1, le=50),
    current=Depends(get_current_user),
):
    user_id = get_uid(current)

    if supabase_admin is None:
        raise HTTPException(status_code=500, detail="Admin client not initialized")

    # get my profile
    my_resp = (
        supabase_admin.table("profiles")
        .select("*")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not my_resp.data:
        raise HTTPException(status_code=404, detail="Current user profile not found")

    me = my_resp.data

    # get all candidate profiles
    all_resp = supabase_admin.table("profiles").select("*").execute()
    all_profiles = all_resp.data or []

    my_offered = set(normalize_list(me.get("skills_offered")))
    my_wanted = set(normalize_list(me.get("skills_wanted")))
    my_text_tokens = set(profile_text(me).split())

    my_exp_rank = EXPERIENCE_RANK.get(str(me.get("experience_level") or "").strip(), 1)

    recommendations = []

    for candidate in all_profiles:
        candidate_id = candidate.get("id")
        if not candidate_id or candidate_id == user_id:
            continue

        candidate_offered = set(normalize_list(candidate.get("skills_offered")))
        candidate_wanted = set(normalize_list(candidate.get("skills_wanted")))

        forward_match = sorted(my_wanted.intersection(candidate_offered))
        reverse_match = sorted(my_offered.intersection(candidate_wanted))

        # must have at least some useful barter overlap
        if not forward_match and not reverse_match:
            continue

        forward_score = len(forward_match) / max(len(my_wanted), 1)
        reverse_score = len(reverse_match) / max(len(my_offered), 1)
        barter_score = 0.5 * forward_score + 0.5 * reverse_score

        candidate_text_tokens = set(profile_text(candidate).split())
        content_score = text_similarity(my_text_tokens, candidate_text_tokens)

        candidate_rating = safe_float(candidate.get("average_rating"), 0.0)
        rating_score = min(candidate_rating / 5.0, 1.0)

        reviews_count = safe_float(candidate.get("reviews_count"), 0.0)
        trust_bonus = min(reviews_count / 20.0, 1.0)

        candidate_exp_rank = EXPERIENCE_RANK.get(
            str(candidate.get("experience_level") or "").strip(),
            1,
        )
        exp_gap = abs(my_exp_rank - candidate_exp_rank)
        experience_score = 1 - (exp_gap / 2)

        final_score = (
            0.55 * barter_score
            + 0.20 * content_score
            + 0.15 * rating_score
            + 0.05 * trust_bonus
            + 0.05 * experience_score
        )

        recommendations.append({
            "id": candidate_id,
            "full_name": candidate.get("full_name"),
            "username": candidate.get("username"),
            "bio": candidate.get("bio"),
            "city": candidate.get("city"),
            "country": candidate.get("country"),
            "profile_image_url": candidate.get("profile_image_url"),
            "skills_offered": normalize_list(candidate.get("skills_offered")),
            "skills_wanted": normalize_list(candidate.get("skills_wanted")),
            "average_rating": round(candidate_rating, 2),
            "reviews_count": int(reviews_count),
            "match_score": round(float(final_score), 4),
            "skills_they_offer_you_need": forward_match,
            "skills_they_want_from_you": reverse_match,
            "why_matched": {
                "barter_score": round(float(barter_score), 4),
                "content_score": round(float(content_score), 4),
                "experience_score": round(float(experience_score), 4),
            },
        })

    recommendations.sort(
        key=lambda x: (
            x["match_score"],
            len(x["skills_they_offer_you_need"]),
            x["average_rating"],
        ),
        reverse=True,
    )

    return {
        "ok": True,
        "recommendations": recommendations[:top_n],
    }