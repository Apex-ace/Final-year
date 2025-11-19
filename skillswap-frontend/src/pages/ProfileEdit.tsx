// ⚠️ IMPORTANT: All logic preserved exactly. Only UI themed & toast added.

import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, getAllSkills } from "../lib/api";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

interface Skill {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  city: string;
  country: string;
  bio: string;
  skills_offered: string[];
  skills_wanted: string[];
  profile_image_url: string | null;
}

export default function ProfileEdit() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // 🔥 Toast state
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  // 🔥 Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const load = async () => {
    try {
      setLoadingData(true);
      const [p, s] = await Promise.all([getMyProfile(), getAllSkills()]);
      setProfile(p);
      setSkills(s);
    } catch (error: any) {
      console.error("❌ FULL LOAD ERROR:", error);
      setToast("Failed to load profile data.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleTextChange = (e: any) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleMultiSelectChange = (
    e: any,
    field: "skills_offered" | "skills_wanted"
  ) => {
    if (!profile) return;
    const values = Array.from(e.target.selectedOptions, (o: any) => o.value);
    setProfile({ ...profile, [field]: values });
  };

  const handleImageUpload = async (e: any) => {
    if (!e.target.files?.length || !profile) return;

    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const fileName = `${profile.id}-${Date.now()}.${ext}`;

    try {
      setImageUploading(true);

      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      setProfile({ ...profile, profile_image_url: data.publicUrl });
      setToast("Profile image updated!");
    } catch (error) {
      console.error("Upload error:", error);
      setToast("Image upload failed.");
    } finally {
      setImageUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await updateMyProfile(profile);
      setToast("Profile updated successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setToast("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData)
    return <div className="text-center text-gray-400 p-10">Loading profile...</div>;
  if (!profile)
    return <div className="text-center text-red-500 p-10">Error loading profile.</div>;

  // THEME (WhatsApp AMOLED)
    const screen = "min-h-screen bg-[#050505] text-gray-200 px-5 safe-top pb-6";
    const card =
    "w-full bg-[#0b0f10]/80 backdrop-blur-xl border border-[#10191c] rounded-2xl p-6 shadow-xl";
  const label = "text-sm text-gray-400 mb-1 block";
  const inputBox =
    "w-full px-4 py-3 bg-[#0c1317] border border-[#1a2a2e] rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400";
  const selectBox =
    "w-full h-32 px-3 py-2 bg-[#0c1317] border border-[#1a2a2e] text-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400";
  const tealBtn =
    "w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold shadow-xl active:scale-95 transition";

  return (
    <div className={screen}>

      {/* 🔥 Toast Popup */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="
            fixed top-5 left-1/2 -translate-x-1/2 
            bg-[#0c1317] border border-[#1a2a2e] 
            text-teal-300 px-5 py-3 rounded-xl 
            shadow-xl z-50 text-sm font-medium
          "
        >
          {toast}
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-bold text-teal-300 text-center mb-6"
      >
        Edit Profile
      </motion.h2>

      <div className="max-w-md mx-auto space-y-6">
        <div className={card}>
          <div className="space-y-6">

            {/* NAME */}
            <div>
              <label className={label}>Name</label>
              <input
                name="full_name"
                className={inputBox}
                value={profile.full_name}
                onChange={handleTextChange}
              />
            </div>

            {/* USERNAME */}
            <div>
              <label className={label}>Username</label>
              <input
                name="username"
                className={inputBox}
                value={profile.username}
                onChange={handleTextChange}
              />
            </div>

            {/* LOCATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>City</label>
                <input
                  name="city"
                  className={inputBox}
                  value={profile.city}
                  onChange={handleTextChange}
                />
              </div>

              <div>
                <label className={label}>Country</label>
                <input
                  name="country"
                  className={inputBox}
                  value={profile.country}
                  onChange={handleTextChange}
                />
              </div>
            </div>

            {/* BIO */}
            <div>
              <label className={label}>Bio</label>
              <textarea
                name="bio"
                rows={4}
                className={inputBox}
                value={profile.bio}
                onChange={handleTextChange}
              />
            </div>

            {/* SKILLS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Skills Offered</label>
                <select
                  multiple
                  className={selectBox}
                  value={profile.skills_offered}
                  onChange={(e) => handleMultiSelectChange(e, "skills_offered")}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={label}>Skills Wanted</label>
                <select
                  multiple
                  className={selectBox}
                  value={profile.skills_wanted}
                  onChange={(e) => handleMultiSelectChange(e, "skills_wanted")}
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PROFILE IMAGE */}
            <div>
              <label className={label}>Profile Image</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profile.profile_image_url ? (
                    <img
                      src={profile.profile_image_url}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border border-[#1a2a2e]"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-[#0c1317] border border-[#1a2a2e] flex items-center justify-center text-gray-500 text-xs">
                      No Img
                    </div>
                  )}

                  {imageUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-xs text-white">
                      Uploading...
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={imageUploading}
                  className="text-sm text-gray-400"
                />
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button
              onClick={saveProfile}
              disabled={saving || imageUploading}
              className={`${tealBtn} ${
                saving || imageUploading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
