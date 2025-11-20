// src/pages/Browse.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

/* Original logic preserved (see original file). */ 

interface Skill { id: string; name: string; }
interface Profile { id: string; full_name: string; username: string; bio: string; city: string; profile_image_url: string | null; skills_offered: string[]; }

export default function Browse() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

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
      if (query) supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);
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

  const searchBox =
    "w-full px-5 py-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-gray-200 placeholder-gray-500 outline-none";

  const card = "bg-[#0c1317]/80 border border-[#1a2a2e] rounded-xl";

  return (
    <MobileShell title="Browse" showBack={!selectedSkill} >
      {!selectedSkill && (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-teal-300 mb-3">Browse Skills</h2>
            <input
              type="text"
              placeholder="Search for Python, Design..."
              className={searchBox}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loadingSkills ? (
            <div className="text-center text-gray-500">Loading skills...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillClick(skill.name)}
                  className="p-3 rounded-xl bg-[#0c1317] border border-[#1a2a2e] text-gray-200 text-sm"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedSkill && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleBack} className="text-gray-400">← Back</button>
            <h3 className="text-md font-semibold">Experts in <span className="text-teal-300">{selectedSkill}</span></h3>
            <div className="w-8" />
          </div>

          {loadingProfiles ? (
            <div className="space-y-4">
              <div className={`${card} h-28 animate-pulse`} />
              <div className={`${card} h-28 animate-pulse`} />
            </div>
          ) : profiles.length === 0 ? (
            <div className={`${card} p-6 text-center text-gray-400`}>No users found offering {selectedSkill}.</div>
          ) : (
            <div className="space-y-4">
              {profiles.map((p) => (
                <div key={p.id} className={`${card} p-4 flex items-center gap-4`}>
                  {p.profile_image_url ? (
                    <img src={p.profile_image_url} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#1d2a30] flex items-center justify-center text-teal-300 font-bold">
                      {p.full_name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-teal-300">{p.full_name}</div>
                    <div className="text-xs text-gray-400">{p.city || "Remote"}</div>
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">{p.bio}</p>
                  </div>
                  <Link to={`/profile/${p.id}`} className="text-teal-300 text-sm">View</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </MobileShell>
  );
}
