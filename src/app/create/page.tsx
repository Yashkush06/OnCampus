"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock, Users, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const vibeTags = [
  { id: "chill", label: "Chill", color: "var(--color-neon-blue)" },
  { id: "study", label: "Study", color: "var(--color-neon-purple)" },
  { id: "gaming", label: "Gaming", color: "var(--color-neon-pink)" },
  { id: "food", label: "Food", color: "#FFB000" },
  { id: "sports", label: "Sports", color: "#00FF47" },
  { id: "party", label: "Party", color: "#FF0055" },
];

export default function CreateScenePage() {
  const [step, setStep] = useState(1);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  
  // State for form bindings
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [startTimeOffset, setStartTimeOffset] = useState("now");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const activeColor = selectedVibe 
    ? vibeTags.find(v => v.id === selectedVibe)?.color 
    : "var(--color-neon-blue)";

  const handleCreateScene = async () => {
    setIsSubmitting(true);
    try {
      // 1. Get or create a session
      let { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user session available");

      // 3. Calculate dynamic start time based on selection offset
      const start = new Date();
      if (startTimeOffset !== "now") {
        start.setMinutes(start.getMinutes() + parseInt(startTimeOffset, 10));
      }

      // 4. Create scene
      const { data, error: sceneError } = await supabase
        .from("scenes")
        .insert([{
          host_id: user.id,
          title: title || `${selectedVibe ? selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1) : 'Chill'} Hangout`,
          vibe_tag: selectedVibe || "chill",
          location: location || "Campus Cafeteria",
          max_participants: maxParticipants,
          start_time: start.toISOString(),
          is_active: true,
        }] as any)
        .select()
        .single();

      if (sceneError) throw sceneError;
      const newScene = data as any;

      // 5. Automatically register host in scene_participants
      await supabase
        .from("scene_participants")
        .insert([{
          scene_id: newScene.id,
          user_id: user.id,
        }] as any);

      // 6. Navigate directly to the live room for the new scene
      router.push(`/room/${newScene.id}`);
    } catch (err: any) {
      console.error("Failed to host scene:", err);
      alert("Failed to host scene: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      
      {/* Dynamic Ambient Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] opacity-20 blur-[120px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: activeColor }}
      />

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center z-10">
        <Link href="/feed">
          <button className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={20} className="text-white" />
          </button>
        </Link>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                step >= i ? "w-8" : "w-3 bg-white/20"
              )}
              style={{ backgroundColor: step >= i ? activeColor : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 z-10 flex flex-col">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full flex-1"
            >
              <h1 className="text-3xl font-bold mb-2">What's the vibe?</h1>
              <p className="text-white/50 mb-8">Choose a category for your scene.</p>
              
              <div className="grid grid-cols-2 gap-4 flex-1">
                {vibeTags.map(vibe => (
                  <button
                    key={vibe.id}
                    onClick={() => setSelectedVibe(vibe.id)}
                    className={cn(
                      "rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 border",
                      selectedVibe === vibe.id 
                        ? "bg-white/10 scale-105" 
                        : "glassmorphism border-white/5 hover:border-white/20"
                    )}
                    style={{
                      borderColor: selectedVibe === vibe.id ? vibe.color : undefined,
                      boxShadow: selectedVibe === vibe.id ? `0 0 20px ${vibe.color}30` : undefined
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${vibe.color}20` }}
                    >
                      <Zap size={24} color={vibe.color} />
                    </div>
                    <span className="font-bold">{vibe.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 pb-4">
                <button 
                  onClick={() => selectedVibe && setStep(2)}
                  disabled={!selectedVibe}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300",
                    selectedVibe 
                      ? "bg-white text-black hover:scale-[1.02]" 
                      : "glassmorphism text-white/30 cursor-not-allowed"
                  )}
                  style={{
                    boxShadow: selectedVibe ? `0 0 20px ${activeColor}40` : undefined
                  }}
                >
                  Next Step
                  <ArrowRight size={20} />
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
              className="flex flex-col h-full flex-1 space-y-6"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">Give it a title</h1>
                <p className="text-white/50">Make it catchy. What are you doing?</p>
              </div>

              <div className="relative">
                <input 
                  type="text" 
                  placeholder="e.g. Midnight Maggie Run 🍜" 
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-b-2 border-white/20 py-4 text-2xl font-bold text-white placeholder-white/20 focus:outline-none transition-colors"
                  style={{ borderBottomColor: activeColor }}
                />
              </div>

              <div className="space-y-4 mt-8">
                <h3 className="font-medium text-white/70">Details</h3>
                
                <div className="glassmorphism rounded-2xl p-4 flex items-center gap-4 border border-white/5 focus-within:border-white/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <MapPin size={20} className="text-white/70" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Where? (e.g. Main Gate)" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-white/40"
                  />
                </div>

                <div className="glassmorphism rounded-2xl p-4 flex items-center gap-4 border border-white/5 focus-within:border-white/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Clock size={20} className="text-white/70" />
                  </div>
                  <select 
                    value={startTimeOffset}
                    onChange={(e) => setStartTimeOffset(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white focus:outline-none appearance-none"
                  >
                    <option value="now" className="bg-bg-dark">Starting Now</option>
                    <option value="15" className="bg-bg-dark">In 15 mins</option>
                    <option value="30" className="bg-bg-dark">In 30 mins</option>
                    <option value="60" className="bg-bg-dark">In 1 hour</option>
                  </select>
                </div>

                <div className="glassmorphism rounded-2xl p-4 flex items-center gap-4 border border-white/5 focus-within:border-white/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <Users size={20} className="text-white/70" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Max people (optional)" 
                    value={maxParticipants === null ? "" : maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-white/40"
                  />
                </div>
              </div>

              <div className="mt-auto pb-4 pt-8">
                <button 
                  onClick={() => setStep(3)}
                  disabled={!title.trim() || !location.trim()}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-transform",
                    title.trim() && location.trim()
                      ? "bg-white text-black hover:scale-[1.02]" 
                      : "glassmorphism text-white/30 cursor-not-allowed"
                  )}
                  style={{ boxShadow: title.trim() && location.trim() ? `0 0 20px ${activeColor}40` : undefined }}
                >
                  Review Scene
                  <ArrowRight size={20} />
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
              className="flex flex-col h-full flex-1"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2">Ready to host?</h1>
                <p className="text-white/50 mb-8">Here's how your scene will look.</p>
              </div>

              {/* Live Preview Card */}
              <div className="w-full glassmorphism rounded-3xl p-5 border relative overflow-hidden" style={{ borderColor: `${activeColor}40` }}>
                <div 
                  className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                  style={{ backgroundColor: activeColor, boxShadow: `0 0 20px ${activeColor}` }}
                />
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <h2 className="text-xl font-bold leading-tight">{title || "Untitled Scene"}</h2>
                    <p className="text-sm text-white/50 mt-1">Hosted by You</p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-white/80">
                    {startTimeOffset === "now" ? "Starting Now" : `Starting in ${startTimeOffset}m`}
                  </span>
                </div>
                <div className="pl-2 space-y-2 mb-5">
                  <div className="flex justify-between text-sm text-white/70">
                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {location || "TBD"}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/70">
                    <span className="flex items-center gap-1.5"><Users size={16} /> 1/{maxParticipants || "∞"} joined</span>
                  </div>
                </div>
                <div className="pl-2 pt-4 border-t border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-white/5 rounded-md text-white/60">
                    {vibeTags.find(v => v.id === selectedVibe)?.label || 'Vibe'}
                  </span>
                </div>
              </div>

              <div className="mt-auto pb-4 pt-8 space-y-4">
                <button 
                  onClick={handleCreateScene}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 bg-white text-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all"
                  style={{ boxShadow: `0 0 20px ${activeColor}40` }}
                >
                  {isSubmitting ? "Creating Scene..." : "Host Scene Now"}
                  {!isSubmitting && <Zap size={20} className="fill-black" />}
                </button>
                <button 
                  onClick={() => setStep(2)}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl font-medium text-white/60 flex items-center justify-center hover:bg-white/5 disabled:opacity-50 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
