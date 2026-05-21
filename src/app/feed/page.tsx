"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, MapPin, Users, Clock, Flame, Sparkles, Plus, Zap, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScenes } from "@/hooks/useScenes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const categories = ["Nearby", "Chill", "Study", "Gaming", "Food", "Sports", "Party"];

const VIBE_METADATA: Record<string, { color: string; label: string; icon: string }> = {
  chill: { color: "var(--color-neon-blue)", label: "Chill", icon: "🍃" },
  study: { color: "var(--color-neon-purple)", label: "Study", icon: "📚" },
  gaming: { color: "var(--color-neon-pink)", label: "Gaming", icon: "🎮" },
  food: { color: "#FFB000", label: "Food", icon: "🍜" },
  sports: { color: "#00FF47", label: "Sports", icon: "⚽" },
  party: { color: "#FF0055", label: "Party", icon: "🎉" },
};

const getVibeInfo = (tag: string) => {
  const normalized = tag.toLowerCase();
  return VIBE_METADATA[normalized] || { color: "var(--color-neon-blue)", label: tag, icon: "✨" };
};

const formatStartTime = (timeString: string) => {
  try {
    const d = new Date(timeString);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (Math.abs(diffMins) < 5) return "Live Now";
    if (diffMins > 0) {
      if (diffMins < 60) return `In ${diffMins} mins`;
      return `At ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) return `Started ${absMins}m ago`;
      return `Started at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (e) {
    return "Active Now";
  }
};

export default function FeedPage() {
  const [activeCategory, setActiveCategory] = useState("Nearby");
  const [currentUserId, setCurrentUserId] = useState<string>();
  const { scenes } = useScenes(activeCategory, currentUserId);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-[var(--color-neon-blue)] opacity-10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[250px] h-[250px] bg-[var(--color-neon-purple)] opacity-10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Bar */}
      <div className="px-6 py-4 flex justify-between items-center z-10 bg-bg-dark/80 backdrop-blur-md border-b border-white/5">
        <img src="/logo1.png" alt="OnCampus" className="h-8 w-auto object-contain" />
        <div className="flex items-center gap-3">
          <Link href="/discover">
            <button className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors">
              <Search size={20} className="text-white" />
            </button>
          </Link>
          <Link href="/friends?tab=requests">
            <button className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center relative hover:bg-white/10 transition-colors">
              <Bell size={20} className="text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-neon-pink)] animate-pulse shadow-[0_0_8px_var(--color-neon-pink)]" />
            </button>
          </Link>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar z-10 shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300",
              activeCategory === cat 
                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                : "glassmorphism text-white/60 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2 z-10 space-y-6">
        <AnimatePresence mode="popLayout">
          {scenes.length > 0 ? (
            scenes.map((scene, idx) => {
              const vibe = getVibeInfo(scene.vibe_tag);
              const joinedCount = scene.scene_participants?.length ?? 0;
              const maxParticipants = scene.max_participants;
              const isTrending = joinedCount >= 5;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
                  key={scene.id}
                  className="w-full glassmorphism rounded-3xl p-5 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors"
                >
                  {/* Color Accent line */}
                  <div 
                    className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                    style={{ backgroundColor: vibe.color, boxShadow: `0 0 20px ${vibe.color}` }}
                  />
                  
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div>
                      {isTrending && (
                        <div className="flex items-center gap-1 text-[var(--color-neon-pink)] text-xs font-bold uppercase tracking-wider mb-1">
                          <Flame size={12} fill="currentColor" /> Trending
                        </div>
                      )}
                      <h2 className="text-xl font-bold leading-tight">{scene.title}</h2>
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => { e.stopPropagation(); router.push(`/user/${scene.host_id}`); }}>
                        <div className={cn(
                          "w-6 h-6 rounded-full overflow-hidden border cursor-pointer",
                          scene.host?.is_free ? "border-[var(--color-neon-pink)] glow-pink" : "border-white/20"
                        )}>
                          <img src={scene.host?.avatar_url || "https://i.pravatar.cc/150?img=68"} alt="Host" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-sm text-white/50 cursor-pointer hover:text-white">
                          Hosted by @{scene.host?.username || "student"}
                        </p>
                        {scene.host?.is_free && (
                          <Zap size={12} className="text-[var(--color-neon-pink)]" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-md",
                        formatStartTime(scene.start_time) === "Live Now" 
                          ? "bg-[var(--color-neon-blue)]/20 text-[var(--color-neon-blue)] border border-[var(--color-neon-blue)]/30" 
                          : "bg-white/10 text-white/80"
                      )}>
                        {formatStartTime(scene.start_time)}
                      </span>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="pl-2 space-y-2 mb-5">
                    <div className="flex justify-between text-sm text-white/70">
                      <span className="flex items-center gap-1.5"><MapPin size={16} /> {scene.location}</span>
                    </div>
                    <div className="flex justify-between text-sm text-white/70">
                      <span className="flex items-center gap-1.5">
                        <Users size={16} /> 
                        {joinedCount} {maxParticipants ? `/ ${maxParticipants}` : ""} joined
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="pl-2 flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-white/5 rounded-md text-white/60">
                        {vibe.icon} {vibe.label}
                      </span>
                    </div>
                    <button 
                      onClick={() => router.push(`/room/${scene.id}`)}
                      className="px-5 py-2 rounded-xl font-bold text-sm bg-white text-black hover:scale-105 active:scale-95 transition-transform"
                      style={{ boxShadow: `0 0 15px ${vibe.color}40` }}
                    >
                      Join Scene
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full glassmorphism rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
                <Sparkles size={32} className="text-[var(--color-neon-blue)] animate-pulse" />
                <div className="absolute inset-0 bg-[var(--color-neon-blue)]/10 blur-md rounded-full" />
              </div>
              <h2 className="text-xl font-bold mb-2">Campus is quiet...</h2>
              <p className="text-sm text-white/50 max-w-[240px] mb-8">
                No active scenes in <span className="text-white font-semibold">"{activeCategory}"</span>. Be the spark and host one!
              </p>
              <Link href="/create" className="w-full max-w-[200px]">
                <button className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] text-white font-bold flex items-center justify-center gap-2 glow-blue hover:scale-[1.02] active:scale-[0.98] transition-transform">
                  <Plus size={18} />
                  Host a Scene
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {scenes.length > 0 && (
          <div className="w-full flex justify-center py-6">
            <p className="text-white/30 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
              Looking for more scenes...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
