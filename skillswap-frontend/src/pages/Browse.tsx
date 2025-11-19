import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";

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
  // State for Skills Search
  const [skills, setSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState("");
  const [loadingSkills, setLoadingSkills] = useState(false);

  // State for Selected Skill & Profiles
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // 1. Load Skills (Debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!selectedSkill) searchSkills();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedSkill]);

  const searchSkills = async () => {
    setLoadingSkills(true);
    try {
      let supabaseQuery = supabase
        .from("skills")
        .select("*")
        .order("name", { ascending: true });

      if (query) supabaseQuery = supabaseQuery.ilike("name", `%${query}%`);

      const { data } = await supabaseQuery;
      setSkills(data || []);
    } catch (error) {
      console.error("Error fetching skills", error);
    } finally {
      setLoadingSkills(false);
    }
  };

  // 2. Load Profiles when a Skill is clicked
  const handleSkillClick = async (skillName: string) => {
    setSelectedSkill(skillName);
    setLoadingProfiles(true);
    setProfiles([]);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .contains("skills_offered", [skillName]); 

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleBack = () => {
    setSelectedSkill(null);
    setProfiles([]);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* --- VIEW 1: SKILL LIST --- */}
        {!selectedSkill && (
          <>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Browse Skills</h2>
              <div className="relative max-w-md mx-auto">
                <input
                  type="text"
                  className="block w-full px-4 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Search for Python, Design..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {loadingSkills ? (
              <div className="text-center text-gray-500">Loading skills...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => handleSkillClick(skill.name)}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-indigo-700">
                      {skill.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* --- VIEW 2: PROFILES LIST --- */}
        {selectedSkill && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-indigo-600 transition font-medium"
              >
                &larr; Back to Skills
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                Experts in <span className="text-indigo-600">{selectedSkill}</span>
              </h2>
            </div>

            {loadingProfiles ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>)}
              </div>
            ) : profiles.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 text-lg">No users found offering {selectedSkill} yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                    <div className="p-6 flex-grow">
                      <div className="flex items-center space-x-4 mb-4">
                        {profile.profile_image_url ? (
                          <img 
                            src={profile.profile_image_url} 
                            alt={profile.full_name} 
                            className="h-12 w-12 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                            {profile.full_name ? profile.full_name[0] : "?"}
                          </div>
                        )}
                        
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {profile.full_name || "Anonymous"}
                          </h3>
                          <p className="text-sm text-gray-500">{profile.city || "Remote"}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {profile.bio || "No bio provided."}
                      </p>
                    </div>
                    
                    <div className="px-6 pb-6 mt-auto">
                        <Link
                          to={`/profile/${profile.id}`}
                          className="block w-full text-center py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg border border-indigo-100 transition-colors text-sm"
                        >
                          View Profile
                        </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}