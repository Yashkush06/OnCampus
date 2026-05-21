"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, Zap, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getVibeInfo } from "@/lib/constants";

const VIBE_CATEGORIES = [
  { id: "all", label: "All Vibes", icon: "✨", color: "var(--color-neon-blue)" },
  { id: "chill", label: "Chill", icon: "🍃", color: "var(--color-neon-blue)" },
  { id: "study", label: "Study", icon: "📚", color: "var(--color-neon-purple)" },
  { id: "gaming", label: "Gaming", icon: "🎮", color: "var(--color-neon-pink)" },
  { id: "food", label: "Food", icon: "🍜", color: "#FFB000" },
  { id: "sports", label: "Sports", icon: "⚽", color: "#00FF47" },
  { id: "party", label: "Party", icon: "🎉", color: "#FF0055" },
];



export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("all");
  const [scenes, setScenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // Load and subscribe to active scenes
  useEffect(() => {
    const fetchScenes = async () => {
      let q = supabase
        .from('scenes')
        .select('*, host:profiles(username, full_name, avatar_url, is_free), scene_participants(user_id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (selectedVibe !== "all") {
        q = q.eq('vibe_tag', selectedVibe);
      }
      
      const { data } = await q;
      if (data) {
        setScenes(data);
      }
      setLoading(false);
    };

    fetchScenes();
    
    // Subscribe to postgres changes
    const channel = supabase
      .channel('discover-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scenes' },
        () => {
          fetchScenes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVibe]);

  // Local filter for search queries
  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch = 
      scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scene.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scene.host?.username || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const activeColor = selectedVibe !== "all" 
    ? VIBE_CATEGORIES.find(c => c.id === selectedVibe)?.color 
    : "var(--color-neon-blue)";

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      
      {/* Ambient background glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] opacity-10 blur-[120px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: activeColor }}
      />

      {/* Search Input Area */}
      <div className="px-6 py-4 z-10 shrink-0">
        <h1 className="text-2xl font-bold mb-4">Discover</h1>
        <div className="relative glassmorphism rounded-2xl border border-white/10 flex items-center px-4 focus-within:border-white/30 transition-colors">
          <Search size={20} className="text-white/40" />
          <input 
            type="text" 
            placeholder="Search hangouts, locations, or friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 pl-3 pr-2 text-white focus:outline-none placeholder-white/40 text-sm"
          />
        </div>
      </div>

      {/* Vibe Filter Chips */}
      <div className="px-6 py-2 flex gap-3 overflow-x-auto no-scrollbar z-10 shrink-0 mb-4">
        {VIBE_CATEGORIES.map((vibe) => {
          const isActive = selectedVibe === vibe.id;
          return (
            <button
              key={vibe.id}
              onClick={() => setSelectedVibe(vibe.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 border",
                isActive 
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                  : "glassmorphism text-white/60 border-white/5 hover:text-white"
              )}
            >
              <span>{vibe.icon}</span>
              <span>{vibe.label}</span>
            </button>
          );
        })}
      </div>

      {/* Discover List */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2 z-10 space-y-6">
        {loading ? (
          <div className="h-full flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
          </div>
        ) : filteredScenes.length > 0 ? (
          <AnimatePresence>
            {filteredScenes.map((scene, idx) => {
              const vibe = getVibeInfo(scene.vibe_tag);
              const joined = scene.scene_participants?.length || 1;
              const max = scene.max_participants;
              const isTrending = joined >= 5;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.2) }}
                  key={scene.id}
                  className="w-full glassmorphism rounded-3xl p-5 border border-white/5 relative overflow-hidden group hover:border-white/15 transition-colors"
                >
                  <div 
                    className="absolute top-0 left-0 w-1.5 h-full opacity-80"
                    style={{ backgroundColor: vibe.color, boxShadow: `0 0 20px ${vibe.color}` }}
                  />

                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      {isTrending && (
                        <div className="flex items-center gap-1 text-[var(--color-neon-pink)] text-xs font-bold uppercase tracking-wider mb-1">
                          <Flame size={12} fill="currentColor" /> Popular
                        </div>
                      )}
                      <h3 className="font-bold text-lg leading-tight">{scene.title}</h3>
                      <div className="flex items-center gap-2 mt-2" onClick={(e) => { e.stopPropagation(); router.push(`/user/${scene.host_id}`); }}>
                        <div className={cn(
                          "w-5 h-5 rounded-full overflow-hidden border cursor-pointer",
                          scene.host?.is_free ? "border-[var(--color-neon-pink)] glow-pink" : "border-white/20"
                        )}>
                          <img src={scene.host?.avatar_url || "https://i.pravatar.cc/150?img=68"} alt="Host" className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs text-white/50 cursor-pointer hover:text-white">
                          Hosted by @{scene.host?.username || "student"}
                        </p>
                        {scene.host?.is_free && (
                          <Zap size={10} className="text-[var(--color-neon-pink)]" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pl-2 space-y-1.5 mb-4 text-xs text-white/70">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-white/40" />
                      <span>{scene.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-white/40" />
                      <span>{joined} {max ? `/ ${max}` : ""} joined</span>
                    </div>
                  </div>

                  <div className="pl-2 flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-1 bg-white/5 rounded-md text-white/60">
                      {vibe.icon} {vibe.label}
                    </span>
                    <button 
                      onClick={() => router.push(`/room/${scene.id}`)}
                      className="px-4 py-1.5 rounded-xl font-bold text-xs bg-white text-black hover:scale-105 active:scale-95 transition-transform"
                      style={{ boxShadow: `0 0 15px ${vibe.color}40` }}
                    >
                      Join
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
            <Sparkles size={28} className="mb-4 text-white/40" />
            <p className="text-sm font-semibold">No scenes found</p>
            <p className="text-xs max-w-[200px] mt-1">Try another keyword or filter by vibe category above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
