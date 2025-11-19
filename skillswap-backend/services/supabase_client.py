from supabase import create_client
from config import settings

# IMPORTANT:
# Use ANON KEY for user authentication, 
# not the SERVICE ROLE key.

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY  # <-- FIXED
)


def get_user_from_token(access_token: str):

    try:
        result = supabase.auth.get_user(access_token)
        return result.user
    except Exception as e:
        print("Token verify error:", e)
        return None
