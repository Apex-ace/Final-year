// src/pages/ProfileEdit.tsx
import React, { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, getAllSkills } from "../lib/api";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Search, LogOut, AlertTriangle, Menu } from "lucide-react";
import FullPageLoader from "../components/FullPageLoader";

export default function ProfileEdit() {
  const [profile, setProfile] = useState<any | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [skillModalOpen, setSkillModalOpen] = useState<null | "offered" | "wanted">(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function load() {
    try {
      const [p, s] = await Promise.all([getMyProfile(), getAllSkills()]);
      setProfile(p);
      setSkills(s);
    } catch (e) {
      console.error(e);
      setToast("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function toggleSkill(name: string, field: "skills_offered" | "skills_wanted") {
    if (!profile) return;
    const list = profile[field] || [];
    const exists = list.includes(name);
    const updated = exists ? list.filter((s: string) => s !== name) : [...list, name];
    setProfile({ ...profile, [field]: updated });
  }

  const handleImage = async (e: any) => {
    if (!profile) return;
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const fileName = `${profile.id}-${Date.now()}.${ext}`;

    try {
      setUploading(true);
      const { error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      setProfile({ ...profile, profile_image_url: data.publicUrl });
      setToast("Profile image updated!");
    } catch {
      setToast("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await updateMyProfile(profile);
      setToast("Profile updated");
    } catch {
      setToast("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out", error);
      setToast("Error logging out");
    }
  };

  const actionArea = (
    <button
      onClick={saveProfile}
      disabled={saving}
      className="w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold shadow-md"
    >
      {saving ? "Saving..." : "Save Profile"}
    </button>
  );

  if (loading) return <FullPageLoader />;

  const card = "rounded-2xl bg-[#0b0f10]/80 border border-[#10191c] p-5";

  return (
  <MobileShell title="Edit Profile" actionArea={actionArea}>

    {/* 🔥 HEADER ACTION */}
    <div className="flex justify-end mb-4">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 rounded-xl bg-[#0c1317] border border-[#1a2a2e]"
      >
        <Menu className="w-5 h-5 text-gray-400" />
      </button>
    </div>

    {/* 🔥 TOAST */}
    {toast && (
      <div className="
        mb-4 text-center py-2 rounded-xl
        bg-[#0c1317] border border-[#1a2a2e]
        text-teal-300 text-sm
      ">
        {toast}
      </div>
    )}

    {/* 🔥 PROFILE IMAGE */}
    <div className="
      p-5 rounded-2xl
      bg-[#0c1317]/80
      backdrop-blur-xl
      border border-[#1a2a2e]
    ">
      <p className="text-sm text-gray-400 mb-3">Profile Image</p>

      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={
              profile.profile_image_url ||
              "https://api.dicebear.com/7.x/initials/svg?seed=User"
            }
            className="h-20 w-20 rounded-full object-cover border border-[#1a2a2e]"
          />

          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-xs">
              Uploading...
            </div>
          )}
        </div>

        <label className="
          px-4 py-2 rounded-xl
          bg-[#0c1317]
          border border-[#1a2a2e]
          text-sm text-gray-300 cursor-pointer
        ">
          Change
          <input type="file" hidden onChange={handleImage} />
        </label>
      </div>
    </div>

    {/* 🔥 BASIC INFO */}
    <div className="mt-5 space-y-4">

      <div className="space-y-2">
        <label className="text-xs text-gray-400">Full Name</label>
        <input
          value={profile.full_name}
          onChange={(e) =>
            setProfile({ ...profile, full_name: e.target.value })
          }
          className="
            w-full px-4 py-3 rounded-xl
            bg-[#0c1317]
            border border-[#1a2a2e]
            text-white
          "
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-400">Username</label>
        <input
          value={profile.username}
          onChange={(e) =>
            setProfile({ ...profile, username: e.target.value })
          }
          className="
            w-full px-4 py-3 rounded-xl
            bg-[#0c1317]
            border border-[#1a2a2e]
            text-white
          "
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="City"
          value={profile.city}
          onChange={(e) =>
            setProfile({ ...profile, city: e.target.value })
          }
          className="px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e]"
        />
        <input
          placeholder="Country"
          value={profile.country}
          onChange={(e) =>
            setProfile({ ...profile, country: e.target.value })
          }
          className="px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e]"
        />
      </div>

      <textarea
        rows={4}
        placeholder="Your bio..."
        value={profile.bio}
        onChange={(e) =>
          setProfile({ ...profile, bio: e.target.value })
        }
        className="
          w-full px-4 py-3 rounded-xl
          bg-[#0c1317]
          border border-[#1a2a2e]
        "
      />
    </div>

    {/* 🔥 SKILLS */}
    <div className="mt-6 space-y-4">

      {/* Offered */}
      <div className="
        p-4 rounded-2xl
        bg-[#0c1317]/80
        border border-[#1a2a2e]
      ">
        <div className="flex justify-between mb-3">
          <p className="text-sm text-gray-400">Skills Offered</p>
          <button
            onClick={() => setSkillModalOpen("offered")}
            className="text-teal-300 text-sm"
          >
            + Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.skills_offered?.map((skill: string) => (
            <span
              key={skill}
              className="
                px-3 py-1 rounded-full
                bg-[#00e6c3]/10
                border border-[#00e6c3]/20
                text-teal-300 text-xs flex items-center gap-2
              "
            >
              {skill}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleSkill(skill, "skills_offered")}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Wanted */}
      <div className="
        p-4 rounded-2xl
        bg-[#0c1317]/80
        border border-[#1a2a2e]
      ">
        <div className="flex justify-between mb-3">
          <p className="text-sm text-gray-400">Skills Wanted</p>
          <button
            onClick={() => setSkillModalOpen("wanted")}
            className="text-teal-300 text-sm"
          >
            + Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.skills_wanted?.map((skill: string) => (
            <span
              key={skill}
              className="
                px-3 py-1 rounded-full
                bg-[#00e6c3]/10
                border border-[#00e6c3]/20
                text-teal-300 text-xs flex items-center gap-2
              "
            >
              {skill}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => toggleSkill(skill, "skills_wanted")}
              />
            </span>
          ))}
        </div>
      </div>

    </div>

  </MobileShell>
);
}