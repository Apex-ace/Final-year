import React, { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, getAllSkills } from "../lib/api";
import { supabase } from "../lib/supabase";
import MobileShell from "../components/MobileShell";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Search, LogOut, AlertTriangle, Menu } from "lucide-react";
import FullPageLoader from "../components/FullPageLoader"; // Import

export default function ProfileEdit() {
  const [profile, setProfile] = useState<any | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // ... state definitions remain ...
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [skillModalOpen, setSkillModalOpen] = useState<null | "offered" | "wanted">(null);
  const [skillSearch, setSkillSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ... useEffects and functions remain exactly the same ...
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

  // --- UPDATED ---
  if (loading) return <FullPageLoader />;

  const card = "rounded-2xl bg-[#0b0f10]/80 border border-[#10191c] p-5";

  return (
    <MobileShell title="Edit Profile" actionArea={actionArea}>
      {/* ... rest of your ProfileEdit render code remains exactly the same ... */}
      
      {/* HEADER / HAMBURGER */}
      <div className="relative flex justify-end items-center mb-4 z-30">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg bg-[#0c1317] border border-[#1a2a2e] text-gray-400 hover:text-teal-300 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* DROPDOWN MENU */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Transparent Backdrop to close menu on click-outside */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setMenuOpen(false)} 
              />
              
              {/* The Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 right-0 w-48 bg-[#0b0f10] border border-[#1a2a2e] rounded-xl shadow-2xl z-40 overflow-hidden p-1.5"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-colors text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {toast && (
        <div className="mb-3 text-center text-teal-300 bg-[#0c1317] border border-[#1a2a2e] py-2 rounded-xl">
          {toast}
        </div>
      )}

      {/* PROFILE IMAGE */}
      <div className={card}>
        <p className="text-sm text-gray-400 mb-2">Profile Image</p>
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
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-xs">
                Uploading...
              </div>
            )}
          </div>
          <label className="bg-[#0c1317] border border-[#1a2a2e] px-4 py-2 rounded-xl text-sm cursor-pointer text-gray-300">
            Choose File
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImage}
            />
          </label>
        </div>
      </div>

      {/* BASIC INFO */}
      <div className={`${card} mt-5 space-y-4`}>
        <div>
          <p className="text-sm text-gray-400 mb-1">Full Name</p>
          <input
            className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-4 py-3"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
          />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Username</p>
          <input
            className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-4 py-3"
            value={profile.username}
            onChange={(e) =>
              setProfile({ ...profile, username: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">City</p>
            <input
              className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-4 py-3"
              value={profile.city}
              onChange={(e) =>
                setProfile({ ...profile, city: e.target.value })
              }
            />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Country</p>
            <input
              className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-4 py-3"
              value={profile.country}
              onChange={(e) =>
                setProfile({ ...profile, country: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-1">Bio</p>
          <textarea
            className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-4 py-3"
            rows={4}
            value={profile.bio}
            onChange={(e) =>
              setProfile({ ...profile, bio: e.target.value })
            }
          />
        </div>
      </div>

      {/* SKILLS */}
      <div className="mt-5 space-y-5">
        {/* Offered */}
        <div className={card}>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Skills Offered</p>
            <button
              onClick={() => setSkillModalOpen("offered")}
              className="text-teal-300 text-sm"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap mt-3 gap-2">
            {profile.skills_offered?.map((skill: string) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full bg-[#0f1b1d] border border-[#1a2a2e] text-teal-300 text-xs flex items-center gap-2"
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
        <div className={card}>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">Skills Wanted</p>
            <button
              onClick={() => setSkillModalOpen("wanted")}
              className="text-teal-300 text-sm"
            >
              + Add
            </button>
          </div>

          <div className="flex flex-wrap mt-3 gap-2">
            {profile.skills_wanted?.map((skill: string) => (
              <span
                key={skill}
                className="px-3 py-1 rounded-full bg-[#0f1b1d] border border-[#1a2a2e] text-teal-300 text-xs flex items-center gap-2"
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

      {/* SKILL MODAL */}
      <AnimatePresence>
        {skillModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end"
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="w-full max-w-md bg-[#0b0f10] rounded-t-2xl p-5 border-t border-[#1a2a2e]"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-teal-300 font-semibold">Select Skills</p>
                <X
                  className="text-gray-300 cursor-pointer"
                  onClick={() => setSkillModalOpen(null)}
                />
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full bg-[#0c1317] border border-[#1a2a2e] rounded-xl px-8 py-2 text-gray-200"
                />
              </div>

              {/* Skill list */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {skills
                  .filter((s) =>
                    s.name.toLowerCase().includes(skillSearch.toLowerCase())
                  )
                  .map((s) => {
                    const selected = profile[
                      skillModalOpen === "offered"
                        ? "skills_offered"
                        : "skills_wanted"
                    ]?.includes(s.name);

                    return (
                      <div
                        key={s.id}
                        onClick={() =>
                          toggleSkill(
                            s.name,
                            skillModalOpen === "offered"
                              ? "skills_offered"
                              : "skills_wanted"
                          )
                        }
                        className="flex items-center justify-between bg-[#0c1317] border border-[#1a2a2e] px-4 py-3 rounded-xl cursor-pointer"
                      >
                        <span className="text-gray-200">{s.name}</span>
                        {selected && <Check className="text-teal-300" />}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGOUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-5"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#0b0f10] border border-[#1a2a2e] rounded-2xl p-6 text-center shadow-2xl"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-400 w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">Log Out?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to sign out? Any unsaved changes will be lost.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium shadow-lg shadow-red-900/20"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </MobileShell>
  );
}