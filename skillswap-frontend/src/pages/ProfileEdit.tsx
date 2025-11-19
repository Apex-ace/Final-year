import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, getAllSkills } from "../lib/api";
import { supabase } from "../lib/supabase";

// 1. Define Types for better safety
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
  
  // separate loading states for better UX
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoadingData(true);
      // Run these in parallel for speed
      const [p, s] = await Promise.all([getMyProfile(), getAllSkills()]);
      setProfile(p);
      setSkills(s);
    } catch (error: any) {
      // ✅ ADDED: Detailed Error Logging
      // Check your Browser Console (F12) to see if it's a 404 or 500 error
      console.error("❌ FULL LOAD ERROR:", error);
      if (error.response) {
        console.error("Server Response:", error.response.data);
        console.error("Status Code:", error.response.status);
      }
      alert("Failed to load profile data. Check console for details.");
    } finally {
      setLoadingData(false);
    }
  };

  // 2. Generic Input Handler
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      setImageUploading(true);
      
      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("profile-images")
        .getPublicUrl(filePath);

      setProfile({ ...profile, profile_image_url: data.publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setImageUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      await updateMyProfile(profile);
      alert("Saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // 3. Helper for multi-select changes
  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, field: 'skills_offered' | 'skills_wanted') => {
    if (!profile) return;
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    setProfile({ ...profile, [field]: values });
  };

  if (loadingData) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-red-500">Error loading profile.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 bg-white shadow-md rounded-xl mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
        Edit Profile
      </h2>

      <div className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={profile.full_name || ""}
            onChange={handleTextChange}
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={profile.username || ""}
            onChange={handleTextChange}
          />
        </div>

        {/* Location Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              id="city"
              name="city"
              type="text"
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={profile.city || ""}
              onChange={handleTextChange}
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              id="country"
              name="country"
              type="text"
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={profile.country || ""}
              onChange={handleTextChange}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={profile.bio || ""}
            onChange={handleTextChange}
          />
        </div>

        {/* SKILLS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="skills_offered" className="block text-sm font-medium text-gray-700 mb-1">
              Skills Offered <span className="text-xs text-gray-500">(Ctrl+Click)</span>
            </label>
            <select
              id="skills_offered"
              multiple
              className="w-full h-32 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={profile.skills_offered || []}
              onChange={(e) => handleMultiSelectChange(e, 'skills_offered')}
            >
              {skills.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="skills_wanted" className="block text-sm font-medium text-gray-700 mb-1">
              Skills Wanted
            </label>
            <select
              id="skills_wanted"
              multiple
              className="w-full h-32 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={profile.skills_wanted || []}
              onChange={(e) => handleMultiSelectChange(e, 'skills_wanted')}
            >
              {skills.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* IMAGE */}
        <div className="border-t border-gray-200 pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full object-cover border border-gray-300 shadow-sm"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-300">
                    <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
              
              {imageUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white text-xs">
                  Uploading...
                </div>
              )}
            </div>

            <div>
                <input 
                    id="image_upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={imageUploading}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG.</p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="pt-4">
            <button 
                disabled={saving || imageUploading} 
                onClick={saveProfile}
                className={`w-full flex justify-center rounded-md border border-transparent py-3 px-4 text-sm font-medium text-white shadow-sm 
                    ${saving || imageUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'}`}
            >
                {saving ? "Saving..." : "Save Profile"}
            </button>
        </div>
      </div>
    </div>
  );
}