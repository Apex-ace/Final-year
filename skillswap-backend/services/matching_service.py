# services/matching_service.py
from services.supabase_client import supabase
from typing import List, Dict, Any
from collections import Counter

def get_user_skill_ids(user_id: str) -> Dict[str, List[str]]:
    """
    Returns dict: {"offered": [skill_ids], "wanted": [skill_ids]}
    """
    offered = supabase.table("user_skills_offered").select("skill_id").eq("user_id", user_id).execute()
    wanted = supabase.table("user_skills_wanted").select("skill_id").eq("user_id", user_id).execute()

    def extract_ids(resp):
        data = getattr(resp, "data", None) or (resp.json() if hasattr(resp, "json") else None) or []
        return [row.get("skill_id") for row in data if row.get("skill_id")]

    return {"offered": extract_ids(offered), "wanted": extract_ids(wanted)}

def find_matches_for_user(user_id: str, limit: int = 20, offset: int = 0) -> Dict[str, Any]:
    """
    Return users whose skills_offered intersect with this user's skills_wanted.

    Response:
    {
      "matches": [
        {
          "user_id": "...",
          "match_count": <int>,
          "matched_skill_ids": [...],
          "profile": { ... }
        }, ...
      ]
    }
    """
    user_skills = get_user_skill_ids(user_id)
    wanted_skill_ids = user_skills.get("wanted", []) or []

    if not wanted_skill_ids:
        return {"matches": []}

    # Find all rows where other users offer any of the wanted skills
    rows_resp = supabase.table("user_skills_offered") \
        .select("user_id, skill_id") \
        .in_("skill_id", wanted_skill_ids) \
        .neq("user_id", user_id) \
        .execute()

    rows = getattr(rows_resp, "data", None) or (rows_resp.json() if hasattr(rows_resp, "json") else None) or []

    # Count matches per user and collect skill ids
    counter = Counter()
    skills_by_user = {}
    for r in rows:
        uid = r.get("user_id")
        sid = r.get("skill_id")
        if not uid or not sid:
            continue
        counter[uid] += 1
        skills_by_user.setdefault(uid, set()).add(sid)

    # Prepare match list sorted by match_count desc
    match_items = sorted(counter.items(), key=lambda x: x[1], reverse=True)
    # apply offset/limit
    match_items = match_items[offset: offset + limit]

    matches = []
    user_ids = [uid for uid, _ in match_items]
    if not user_ids:
        return {"matches": []}

    # Fetch profiles for these user_ids in a single query
    profiles_resp = supabase.table("profiles").select("*").in_("id", user_ids).execute()
    profiles = getattr(profiles_resp, "data", None) or (profiles_resp.json() if hasattr(profiles_resp, "json") else None) or []
    profiles_map = {p.get("id"): p for p in profiles}

    for uid, count in match_items:
        matches.append({
            "user_id": uid,
            "match_count": count,
            "matched_skill_ids": list(skills_by_user.get(uid, [])),
            "profile": profiles_map.get(uid)
        })

    return {"matches": matches}
