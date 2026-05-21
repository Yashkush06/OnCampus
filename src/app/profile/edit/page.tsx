"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Save, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    university_id: "",
    year: "",
    branch: "",
    bio: "",
    instagram: "",
    snapchat: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
          
        if (data) {
          const pData = data as any;
          setCurrentAvatarUrl(pData.avatar_url || null);
          setFormData({
            username: pData.username || "",
            full_name: pData.full_name || "",
            university_id: pData.university_id || "",
            year: pData.year || "",
            branch: pData.branch || "",
            bio: pData.bio || "",
            instagram: pData.instagram || "",
            snapchat: pData.snapchat || "",
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    
    let finalAvatarUrl = currentAvatarUrl;
    
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });
        
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      } else {
        alert("Avatar upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
    }

    const { error } = await (supabase.from("profiles") as any)
      .update({
        username: formData.username,
        full_name: formData.full_name,
        university_id: formData.university_id,
        year: formData.year,
        branch: formData.branch,
        bio: formData.bio,
        instagram: formData.instagram,
        snapchat: formData.snapchat,
        avatar_url: finalAvatarUrl,
      })
      .eq("id", userId);
      
    setSaving(false);
    
    if (!error) {
      router.push("/profile");
    } else {
      alert("Error updating profile: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-[var(--color-neon-blue)]/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-4 py-3 glassmorphism border-b border-white/10 z-20 sticky top-0 flex items-center justify-between">
        <Link href="/profile">
          <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <ChevronLeft size={24} className="text-white" />
          </button>
        </Link>
        <h1 className="font-bold text-lg">Edit Profile</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-[var(--color-neon-blue)] disabled:opacity-50"
        >
          <Save size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 z-10 space-y-6 pb-24">
        
        {/* Avatar Placeholder */}
        <div className="flex flex-col items-center">
          <label className="w-24 h-24 rounded-full border-2 border-white/10 overflow-hidden mb-3 cursor-pointer hover:border-[var(--color-neon-blue)] transition-colors relative group">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setAvatarPreview(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }} />
            <img src={avatarPreview || currentAvatarUrl || "https://i.pravatar.cc/150?img=68"} alt="Profile" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40">
              <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
            </div>
          </label>
          <span className="text-[var(--color-neon-blue)] text-xs font-bold bg-[var(--color-neon-blue)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-neon-blue)]/20">
            Tap to Change Avatar
          </span>
        </div>

        <div className="space-y-4 mt-8">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1">Full Name</label>
            <input 
              type="text" 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1">Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="@username"
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1 flex items-center gap-1">
              <Shield size={12} className="text-[var(--color-neon-purple)]" /> University / College
            </label>
            <input 
              type="text" 
              name="university_id"
              value={formData.university_id}
              onChange={handleChange}
              placeholder="e.g. MIT, Stanford, DU"
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-purple)] focus:outline-none transition-colors text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 pl-1">Year</label>
              <select 
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-purple)] focus:outline-none transition-colors text-white appearance-none"
              >
                <option value="" className="bg-bg-dark">Select Year</option>
                <option value="1st Year" className="bg-bg-dark">1st Year</option>
                <option value="2nd Year" className="bg-bg-dark">2nd Year</option>
                <option value="3rd Year" className="bg-bg-dark">3rd Year</option>
                <option value="4th Year" className="bg-bg-dark">4th Year</option>
                <option value="Masters" className="bg-bg-dark">Masters</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 pl-1">Branch/Major</label>
              <input 
                type="text" 
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g. CS, Arts"
                className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-purple)] focus:outline-none transition-colors text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1">Bio</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="A little bit about yourself..."
              rows={3}
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors text-white resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1">Instagram Username</label>
            <input 
              type="text" 
              name="instagram"
              value={formData.instagram}
              onChange={handleChange}
              placeholder="e.g. yashkush06"
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-[var(--color-neon-pink)] focus:outline-none transition-colors text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/50 pl-1">Snapchat Username</label>
            <input 
              type="text" 
              name="snapchat"
              value={formData.snapchat}
              onChange={handleChange}
              placeholder="e.g. yashkush06"
              className="w-full glassmorphism rounded-xl px-4 py-3 border border-white/5 focus:border-yellow-400 focus:outline-none transition-colors text-white"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-8 py-4 rounded-xl bg-white text-black font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-transform"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </div>
    </div>
  );
}
