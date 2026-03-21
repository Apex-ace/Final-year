import { createClient } from "@supabase/supabase-js";

// Environment variables from Vite (must start with VITE_)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Backend FastAPI URL (what frontend calls)
export const apiBase =
  import.meta.env.VITE_API_BASE_URL;
