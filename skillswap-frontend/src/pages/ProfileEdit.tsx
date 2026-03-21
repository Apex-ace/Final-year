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
      className="w-full py-3 rounded-xl bg-gradient-to-br from-[#00e6c3] to-[#009f82] text-black font-semibold shadow-md disabled:opacity-70 transition-opacity"
    >
      {saving ? "Saving..." : "Save Profile"}
    </button>
  );

  if (loading) return <FullPageLoader />;

  return (
    <MobileShell title="Edit Profile" actionArea={actionArea}>
      <div className="space-y-6 pb-6">
        {/* 🔥 HEADER ACTION */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl bg-[#0c1317] border border-[#1a2a2e] hover:bg-[#1a2a2e] transition"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 🔥 TOAST */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center py-2 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-teal-300 text-sm shadow-lg"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 PROFILE IMAGE */}
        <div className="p-5 rounded-2xl bg-[#0c1317]/80 backdrop-blur-xl border border-[#1a2a2e] shadow-sm">
          <p className="text-sm text-gray-400 mb-4 font-medium">Profile Image</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={
                  profile.profile_image_url ||
                  "https://api.dicebear.com/7.x/initials/svg?seed=User"
                }
                className="h-20 w-20 rounded-full object-cover border-2 border-[#1a2a2e]"
                alt="Profile"
              />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-xs text-white font-medium backdrop-blur-sm">
                  Uploading...
                </div>
              )}
            </div>

            <label className="px-5 py-2.5 rounded-xl bg-[#0b0f10] border border-[#1a2a2e] text-sm text-gray-300 cursor-pointer hover:bg-[#1a2a2e] transition">
              Change Picture
              <input type="file" hidden onChange={handleImage} accept="image/*" />
            </label>
          </div>
        </div>

        {/* 🔥 BASIC INFO */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">Full Name</label>
            <input
              value={profile.full_name || ""}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">Username</label>
            <input
              value={profile.username || ""}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">City</label>
              <input
                placeholder="City"
                value={profile.city || ""}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">Country</label>
              <input
                placeholder="Country"
                value={profile.country || ""}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">Bio</label>
            <textarea
              rows={4}
              placeholder="Tell us about yourself..."
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-white focus:border-[#00e6c3]/50 focus:outline-none transition resize-none"
            />
          </div>
        </div>

        {/* 🔥 SKILLS */}
        <div className="space-y-4">
          {/* Offered */}
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-400">Skills Offered</p>
              <button
                onClick={() => {
                  setSkillSearch("");
                  setSkillModalOpen("offered");
                }}
                className="text-teal-300 text-sm font-medium hover:text-teal-200 transition"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills_offered?.length === 0 && (
                <span className="text-xs text-gray-600 italic">No skills added yet</span>
              )}
              {profile.skills_offered?.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs flex items-center gap-2"
                >
                  {skill}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSkill(skill, "skills_offered")}
                  />
                </span>
              ))}
            </div>
          </div>

          {/* Wanted */}
          <div className="p-4 rounded-2xl bg-[#0c1317]/80 border border-[#1a2a2e]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-gray-400">Skills Wanted</p>
              <button
                onClick={() => {
                  setSkillSearch("");
                  setSkillModalOpen("wanted");
                }}
                className="text-teal-300 text-sm font-medium hover:text-teal-200 transition"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.skills_wanted?.length === 0 && (
                <span className="text-xs text-gray-600 italic">No skills added yet</span>
              )}
              {profile.skills_wanted?.map((skill: string) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-full bg-[#00e6c3]/10 border border-[#00e6c3]/20 text-teal-300 text-xs flex items-center gap-2"
                >
                  {skill}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSkill(skill, "skills_wanted")}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 SKILL MODAL */}
      <AnimatePresence>
        {skillModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#0c1317] border border-[#1a2a2e] p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[70vh] sm:h-auto sm:max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-white">
                  Select {skillModalOpen === "offered" ? "Skills Offered" : "Skills Wanted"}
                </h3>
                <button
                  onClick={() => setSkillModalOpen(null)}
                  className="p-2 bg-[#1a2a2e] rounded-full text-gray-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0b0f10] border border-[#1a2a2e] text-white focus:outline-none focus:border-[#00e6c3]/50 transition"
                />
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-2">
                {skills
                  .filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                  .map((skill) => {
                    const key = skillModalOpen === "offered" ? "skills_offered" : "skills_wanted";
                    const selected = profile[key]?.includes(skill.name);

                    return (
                      <div
                        key={skill.id}
                        onClick={() => toggleSkill(skill.name, key)}
                        className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition border ${
                          selected
                            ? "bg-[#00e6c3]/10 border-[#00e6c3]/30 text-teal-300"
                            : "bg-[#0b0f10] border-[#1a2a2e] text-gray-300 hover:border-gray-600"
                        }`}
                      >
                        <span className="font-medium">{skill.name}</span>
                        {selected && <Check className="w-5 h-5" />}
                      </div>
                    );
                  })}
                {skills.filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase())).length === 0 && (
                  <p className="text-center text-gray-500 mt-4 text-sm">No skills found.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileShell>
  );
}