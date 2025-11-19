import axios from "axios";
import { supabase } from "./supabase";

// ✅ FIX 1: Set BASE_URL to port 10000
export const api = axios.create({
  baseURL: "http://localhost:10000", 
});

// Add Supabase auth token to headers
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ==========================
// ⭐ Skills API
// ==========================

// Get all skills
export async function getAllSkills() {
  // ✅ FIX 2: Added trailing slash to prevent 404 (Your logs confirm this is necessary)
  const res = await api.get("/skills/"); 
  return res.data.skills;
}

// Update user's skills
export async function updateMySkills(skills_offered: any, skills_wanted: any) {
  const res = await api.post("/skills/me", {
    skills_offered,
    skills_wanted,
  });
  return res.data;
}

// ==========================
// ⭐ Profile API
// ==========================

export async function getMyProfile() {
  const res = await api.get("/users/me");
  return res.data.profile;
}

export async function updateMyProfile(payload: any) {
  const res = await api.put("/users/me", payload);
  return res.data;
}