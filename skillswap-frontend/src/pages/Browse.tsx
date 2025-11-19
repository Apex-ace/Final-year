import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// --- TYPES ---
interface Skill {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  city: string;
  profile_image_url: string | null;
  skills_offered: string[];
}

export default function Browse() {
  // States
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Search skill with debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      if (!selectedSkill) searchSkills();
    }, 500);
    return () => clearTimeout(delay);
  }, [query]);

  const searchSkills = async () => {
    setLoadingSkills(true);
    try {
      let supabaseQuery = supabase.from("skills").select("*").order("name");

      if (query)
        supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);

      const { data } = await supabaseQuery;
      setSkills(data || []);
    } catch (err) {
      console.error("Error fetching skills:", err);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSkillClick = async (skillName: string) => {
    setSelectedSkill(skillName);
    setLoadingProfiles(true);
    setProfiles([]);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .contains("skills_offered", [skillName]);

      setProfiles(data || []);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleBack = () => {
    setSelectedSkill(null);
    setProfiles([]);
    setQuery("");
  };

  // ============================
  // THEME VARIABLES
  // ============================
  const screen = "min-h-screen bg-[#050505] text-gray-200 px-4 py-6";
  const card = "bg-[#0c1317]/80 backdrop-blur-xl border border-[#1a2a2e] rounded-xl shadow-lg";
  const searchBox =
    "w-full px-5 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-teal-400 outline-none";
  const skillBtn =
    "p-4 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-gray-200 hover:text-teal-300 hover:border-teal-500 shadow transition font-medium text-center";
  const profileBtn =
    "block w-full text-center py-2 rounded-lg bg-[#0e181b] border border-[#1a2a2e] text-teal-300 hover:border-teal-400 hover:bg-[#122125] transition font-semibold";

  return (
    <div className={screen}>
      <div className="max-w-4xl mx-auto">

        {/* ===== SKILL LIST VIEW ===== */}
        {!selectedSkill && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h2 className="text-3xl font-bold text-teal-300 mb-4">
                Browse Skills
              </h2>

              <input
                type="text"
                placeholder="Search for Python, Design..."
                className={searchBox}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </motion.div>

            {loadingSkills ? (
              <div className="text-center text-gray-500">Loading skills...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {skills.map((skill) => (
                  <motion.button
                    key={skill.id}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleSkillClick(skill.name)}
                    className={skillBtn}
                  >
                    {skill.name}
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== PROFILES VIEW ===== */}
        {selectedSkill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-teal-300 transition"
              >
                ← Back
              </button>

              <h2 className="text-xl font-semibold">
                Experts in <span className="text-teal-300">{selectedSkill}</span>
              </h2>
            </div>

            {/* Loading Skeleton */}
            {loadingProfiles ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2].map((x) => (
                  <div
                    key={x}
                    className="h-40 rounded-xl bg-[#0c1317]/60 border border-[#1a2a2e] animate-pulse"
                  ></div>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <div className={`${card} p-6 text-center`}>
                <p className="text-gray-400 text-lg">
                  No users found offering {selectedSkill}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {profiles.map((profile) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`${card} overflow-hidden`}
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-center gap-4 mb-3">
                        {profile.profile_image_url ? (
                          <img
                            src={profile.profile_image_url}
                            className="h-12 w-12 rounded-full object-cover border border-[#1a2a2e]"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-[#1d2a30] flex items-center justify-center text-teal-300 font-bold">
                            {profile.full_name?.[0]}
                          </div>
                        )}

                        <div>
                          <h3 className="text-lg font-bold text-teal-300">
                            {profile.full_name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {profile.city || "Remote"}
                          </p>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                        {profile.bio || "No bio provided."}
                      </p>

                      {/* View Profile */}
                      <Link to={`/profile/${profile.id}`} className={profileBtn}>
                        View Profile
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
