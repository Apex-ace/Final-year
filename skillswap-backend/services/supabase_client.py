# skillswap-backend/services/supabase_client.py
from supabase import create_client
from config import settings

# --- 1. REGULAR CLIENT (Uses ANON KEY, subject to RLS) ---
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_ANON_KEY 
)

# --- 2. ADMIN CLIENT (Uses SERVICE ROLE KEY, bypasses RLS) ---
try:
    service_key = settings.SUPABASE_SERVICE_ROLE_KEY
    
    print(f"DEBUG: Service Key Length: {len(service_key)}")
    
    supabase_admin = create_client(
        settings.SUPABASE_URL,
        service_key
    )
    print("DEBUG: Admin client initialized successfully.")
    
except Exception as e:
    print(f"FATAL ERROR: Admin client initialization failed. Is SERVICE_ROLE_KEY correct in .env? Error: {e}")
    supabase_admin = None


def get_user_from_token(access_token: str):
    """
    Verifies the user's JWT token using the regular client.
    """
    try:
        result = supabase.auth.get_user(access_token)
        return result.user
    except Exception as e:
        print("Token verify error:", e)
        return None