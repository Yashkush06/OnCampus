"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, User, Camera, Sparkles, Book, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const VIBES = [
  { id: "chill", label: "Chill", icon: "🍃" },
  { id: "study", label: "Study", icon: "📚" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "party", label: "Party", icon: "🎉" },
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Masters"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatarPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    branch: "",
    year: "",
    bio: "",
    vibe: "chill",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      // 1. Sign in anonymously
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError || !authData.user) {
        throw new Error(authError?.message || "Failed to create anonymous session. Please ensure Anonymous Sign-ins are enabled in Supabase.");
      }

      let finalAvatarUrl = `https://i.pravatar.cc/150?u=${authData.user.id}`;
      
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authData.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });
          
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = publicUrl;
        } else {
          console.error("Avatar upload failed:", uploadError);
        }
      }

      // 2. Insert profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          id: authData.user.id,
          username: formData.username || `user_${Math.floor(Math.random() * 10000)}`,
          full_name: formData.full_name,
          branch: formData.branch,
          year: formData.year,
          avatar_url: finalAvatarUrl,
          is_free: false,
          badges: ["Early Adopter"]
        }] as any);

      if (profileError) {
        // If profile insert fails (e.g. duplicate username), we should show error
        throw new Error("Failed to create profile: " + profileError.message);
      }

      // Success, redirect to feed
      router.push("/feed");
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.full_name || !formData.username)) {
      setError("Please fill out your name and username");
      return;
    }
    if (step === 2 && (!formData.branch || !formData.year)) {
      setError("Please fill out your course details");
      return;
    }
    setStep(prev => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark relative overflow-hidden text-white">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[var(--color-neon-blue)] opacity-20 blur-[100px] rounded-full pointer-events-none transition-all duration-700" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[var(--color-neon-purple)] opacity-20 blur-[100px] rounded-full pointer-events-none transition-all duration-700" />

      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10 z-20 sticky top-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] glow-blue"
          initial={{ width: "33%" }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-24 z-10 flex flex-col">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-10">
                <Sparkles className="text-[var(--color-neon-blue)] mb-4" size={32} />
                <h1 className="text-3xl font-bold mb-2">Who are you?</h1>
                <p className="text-white/60">Let's set up your campus persona.</p>
              </div>

              <div className="flex justify-center mb-8">
                <label className="relative w-28 h-28 rounded-full border-2 border-white/20 border-dashed flex items-center justify-center bg-white/5 group overflow-hidden cursor-pointer hover:border-[var(--color-neon-blue)] transition-colors">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="text-white/40 group-hover:text-[var(--color-neon-blue)] transition-colors" size={32} />
                      <p className="absolute bottom-3 text-[10px] text-white/40 uppercase font-bold tracking-wider group-hover:text-[var(--color-neon-blue)]">Add Pic</p>
                    </>
                  )}
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 pl-1">Full Name</label>
                  <input 
                    type="text" name="full_name"
                    value={formData.full_name} onChange={handleChange}
                    placeholder="e.g. Yash Kumar"
                    className="w-full glassmorphism rounded-xl px-4 py-4 border border-white/5 focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 pl-1">Username</label>
                  <input 
                    type="text" name="username"
                    value={formData.username} onChange={handleChange}
                    placeholder="e.g. yash123"
                    className="w-full glassmorphism rounded-xl px-4 py-4 border border-white/5 focus:border-[var(--color-neon-blue)] focus:outline-none transition-colors"
                  />
                </div>
                {error && <p className="text-[var(--color-neon-pink)] text-xs font-bold pl-1 animate-pulse">{error}</p>}
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={nextStep}
                  className="w-full py-4 rounded-xl bg-[var(--color-neon-blue)] text-black font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 glow-blue transition-opacity"
                >
                  Continue <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-10">
                <Book className="text-[var(--color-neon-purple)] mb-4" size={32} />
                <h1 className="text-3xl font-bold mb-2">Academics</h1>
                <p className="text-white/60">Find people in your classes.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 pl-1">Course / Branch</label>
                  <input 
                    type="text" name="branch"
                    value={formData.branch} onChange={handleChange}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full glassmorphism rounded-xl px-4 py-4 border border-white/5 focus:border-[var(--color-neon-purple)] focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 pl-1">Year of Study</label>
                  <div className="flex flex-wrap gap-3">
                    {YEARS.map(y => (
                      <button 
                        key={y}
                        onClick={() => setFormData({...formData, year: y})}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                          formData.year === y 
                            ? 'bg-[var(--color-neon-purple)] text-white border-transparent shadow-[0_0_15px_var(--color-neon-purple)]' 
                            : 'glassmorphism border-white/10 text-white/70'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-[var(--color-neon-pink)] text-xs font-bold pl-1 animate-pulse">{error}</p>}
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={nextStep}
                  className="w-full py-4 rounded-xl bg-[var(--color-neon-purple)] text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 shadow-[0_0_15px_var(--color-neon-purple)] transition-opacity"
                >
                  Almost there <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-10">
                <User className="text-[var(--color-neon-pink)] mb-4" size={32} />
                <h1 className="text-3xl font-bold mb-2">Your Vibe</h1>
                <p className="text-white/60">What are you usually up to?</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-white/50 pl-1">Primary Vibe</label>
                  <div className="grid grid-cols-2 gap-3">
                    {VIBES.map(v => (
                      <button 
                        key={v.id}
                        onClick={() => setFormData({...formData, vibe: v.id})}
                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${
                          formData.vibe === v.id 
                            ? 'bg-white/10 border-[var(--color-neon-pink)] shadow-[0_0_15px_rgba(255,0,228,0.3)]' 
                            : 'glassmorphism border-white/5 text-white/50'
                        }`}
                      >
                        <span className="text-2xl">{v.icon}</span>
                        <span className="text-sm font-bold">{v.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50 pl-1">Short Bio</label>
                  <textarea 
                    name="bio"
                    value={formData.bio} onChange={handleChange}
                    placeholder="I code, play guitar, and drink way too much coffee..."
                    className="w-full h-24 glassmorphism rounded-xl px-4 py-4 border border-white/5 focus:border-[var(--color-neon-pink)] focus:outline-none transition-colors resize-none"
                  />
                </div>
                {error && <p className="text-[var(--color-neon-pink)] text-xs font-bold pl-1">{error}</p>}
              </div>

              <div className="mt-auto pt-8">
                <button 
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[var(--color-neon-pink)] to-[var(--color-neon-purple)] text-white font-bold text-lg flex items-center justify-center gap-2 glow-pink hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Creating Profile..." : "Jump into Campus"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
