import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import MobileShell from "../components/MobileShell";

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
  average_rating?: number;
  reviews_count?: number;
}

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
    }, 400);
    return () => clearTimeout(delay);
  }, [query]);

  const searchSkills = async () => {
    setLoadingSkills(true);

    const { data } = await supabase
      .from("skills")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name");

    setSkills(data || []);
    setLoadingSkills(false);
  };

  const handleSkillClick = async (skillName: string) => {
    setSelectedSkill(skillName);
    setLoadingProfiles(true);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .contains("skills_offered", [skillName]);

    setProfiles((data as Profile[]) || []);
    setLoadingProfiles(false);
  };

  const handleBack = () => {
    setSelectedSkill(null);
    setProfiles([]);
    setQuery("");
  };

  return (
    <MobileShell title="Explore" showBack={!!selectedSkill}>
      {!selectedSkill && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Discover Skills
            </h2>
            <p className="text-sm text-gray-400">
              Find people who can help you grow
            </p>
          </div>

          <div className="relative">
            <input
              placeholder="Search skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="
                w-full px-5 py-3
                rounded-2xl
                bg-[#0c1317]
                border border-[#1a2a2e]
                text-white
                placeholder-gray-500
                outline-none
                focus:border-[#00e6c3]
                transition
              "
            />
          </div>

          {loadingSkills ? (
            <div className="text-gray-400 text-sm">Loading skills...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillClick(skill.name)}
                  className="
                    px-4 py-2
                    rounded-full
                    bg-[#0c1317]
                    border border-[#1a2a2e]
                    text-sm text-gray-200
                    hover:bg-[#00e6c3]/10
                    hover:border-[#00e6c3]/30
                    transition
                  "
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSkill && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="text-gray-400">
              ← Back
            </button>

            <h3 className="text-sm font-semibold text-white">
              Experts in <span className="text-[#00e6c3]">{selectedSkill}</span>
            </h3>

            <div className="w-8" />
          </div>

          {loadingProfiles ? (
            <div className="space-y-3">
              <div className="h-24 rounded-xl bg-[#0c1317] animate-pulse" />
              <div className="h-24 rounded-xl bg-[#0c1317] animate-pulse" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              No users found
            </div>
          ) : (
            profiles.map((p) => (
              <Link
                key={p.id}
                to={`/profile/${p.id}`}
                className="
                  flex items-center gap-4
                  p-4
                  rounded-2xl
                  bg-[#0c1317]/80
                  border border-[#1a2a2e]
                  hover:border-[#00e6c3]/30
                  transition
                "
              >
                {p.profile_image_url ? (
                  <img
                    src={p.profile_image_url}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#1d2a30] flex items-center justify-center text-[#00e6c3] font-bold">
                    {p.full_name?.[0]}
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-white font-medium">{p.full_name}</p>

                  <p className="text-xs text-gray-400">
                    {p.city || "Remote"} • ⭐{" "}
                    {Number(p.average_rating || 0).toFixed(1)} •{" "}
                    {p.reviews_count || 0} reviews
                  </p>

                  <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                    {p.bio}
                  </p>
                </div>

                <span className="text-xs text-[#00e6c3] font-medium">
                  View →
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </MobileShell>
  );
}