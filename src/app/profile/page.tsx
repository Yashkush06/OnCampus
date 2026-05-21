"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, Trophy, MapPin, Zap, Flame, Clock, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [updatingFree, setUpdatingFree] = useState(false);
  const [stats, setStats] = useState({ scenes: 0, hosted: 0, friends: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      let { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (data) {
          const pData = data as any;
          setProfile(pData);
          setIsFree(pData.is_free || false);
          
          const { count: hostedCount } = await supabase
            .from("scenes")
            .select('*', { count: 'exact', head: true })
            .eq("host_id", user.id);
            
          const { count: joinedCount } = await supabase
            .from("scene_participants")
            .select('*', { count: 'exact', head: true })
            .eq("user_id", user.id);
            
          const { count: friendsCount } = await supabase
            .from("friendships")
            .select('*', { count: 'exact', head: true })
            .eq("status", "accepted")
            .or(`user_id1.eq.${user.id},user_id2.eq.${user.id}`);

          setStats({
            scenes: joinedCount || 0,
            hosted: hostedCount || 0,
            friends: friendsCount || 0
          });
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [supabase]);

  const toggleFreeMode = async () => {
    if (!profile) return;
    setUpdatingFree(true);
    const newStatus = !isFree;
    
    // Optimistic update
    setIsFree(newStatus);

    const { error } = await (supabase.from("profiles") as any)
      .update({ is_free: newStatus })
      .eq("id", profile.id);

    if (error) {
      // Revert on error
      setIsFree(!newStatus);
      alert("Failed to update status.");
    }
    setUpdatingFree(false);
  };

  const handleShareProfile = async () => {
    if (!profile) return;
    const url = `${window.location.origin}/user/${profile.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${profile.full_name || profile.username}`,
          text: `Check out my profile on OnCampus! Add me here:`,
          url: url,
        });
      } catch (err) {
        console.log("User cancelled share or error:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark h-[100dvh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark h-[100dvh]">
        <p className="text-white/50">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-y-auto no-scrollbar relative">
      
      {/* Dynamic Background */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-[400px] pointer-events-none transition-all duration-1000",
        isFree ? "bg-gradient-to-b from-[var(--color-neon-pink)]/30 to-transparent" : "bg-gradient-to-b from-[var(--color-neon-blue)]/20 to-transparent"
      )} />

      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center z-10 sticky top-0">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <div className="flex gap-2">
          <button onClick={handleShareProfile} className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors">
            <Share2 size={20} className="text-white" />
          </button>
          <Link href="/profile/edit">
            <button className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors">
              <Settings size={20} className="text-white" />
            </button>
          </Link>
        </div>
      </div>

      <div className="px-6 z-10 flex flex-col items-center mt-4">
        {/* Avatar with Glowing Ring if Free */}
        <div className="relative mb-4">
          <div className={cn(
            "w-28 h-28 rounded-full p-1 transition-all duration-500",
            isFree 
              ? "border-4 border-[var(--color-neon-pink)] shadow-[0_0_25px_var(--color-neon-pink)]" 
              : "border-2 border-[var(--color-neon-blue)]"
          )}>
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-4xl overflow-hidden relative">
              <img src={profile.avatar_url || "https://i.pravatar.cc/150?img=68"} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className={cn(
            "absolute bottom-0 right-0 text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-bg-dark flex items-center gap-1 transition-colors",
            isFree ? "bg-[var(--color-neon-pink)] glow-pink" : "bg-[var(--color-neon-blue)] glow-blue"
          )}>
            <Zap size={10} fill="black" /> {isFree ? "FREE" : "Level 12"}
          </div>
        </div>

        <h2 className="text-2xl font-bold">{profile.full_name || `@${profile.username}`}</h2>
        <p className="text-white/60 flex items-center gap-1.5 mt-1 text-sm">
          <Shield size={14} className="text-[var(--color-neon-purple)]" /> 
          {profile.year || "N/A"} • {profile.branch || "N/A"}
        </p>

        {/* Quick Stats */}
        <div className="flex w-full justify-between items-center glassmorphism rounded-2xl p-4 mt-8 border border-white/5">
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl font-bold text-white">{stats.scenes}</span>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">Scenes</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl font-bold text-[var(--color-neon-blue)]">{stats.hosted}</span>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">Hosted</span>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="flex flex-col items-center flex-1">
            <span className="text-2xl font-bold text-white">{stats.friends}</span>
            <span className="text-xs text-white/50 font-medium uppercase tracking-wider mt-1">Friends</span>
          </div>
        </div>

        {/* I'm Free Button (Prominent) */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={toggleFreeMode}
          disabled={updatingFree}
          className={cn(
            "w-full mt-6 py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 overflow-hidden relative group transition-all duration-500",
            isFree 
              ? "bg-gradient-to-r from-[var(--color-neon-pink)] to-[var(--color-neon-purple)] shadow-[0_0_20px_rgba(255,0,228,0.4)] border border-transparent"
              : "glassmorphism border border-white/10 text-white/70 hover:text-white"
          )}
        >
          {isFree && <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />}
          <Flame size={20} fill={isFree ? "white" : "transparent"} className={isFree ? "text-white" : "text-white/50"} />
          {isFree ? "You are Free to Hang!" : "Declare \"I'm Free\" Mode"}
        </motion.button>

        {/* Badges Section */}
        <div className="w-full mt-10">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-[#FFB000]" /> 
            Campus Reputation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glassmorphism rounded-xl p-3 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFB000]/20 flex items-center justify-center">
                ☕
              </div>
              <div>
                <p className="font-bold text-sm">Chai King</p>
                <p className="text-[10px] text-white/40">Hosted 10 chai breaks</p>
              </div>
            </div>
            <div className="glassmorphism rounded-xl p-3 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-neon-blue)]/20 flex items-center justify-center">
                📚
              </div>
              <div>
                <p className="font-bold text-sm">Study Demon</p>
                <p className="text-[10px] text-white/40">50 hrs in library</p>
              </div>
            </div>
            <div className="glassmorphism rounded-xl p-3 border border-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-neon-pink)]/20 flex items-center justify-center">
                🎮
              </div>
              <div>
                <p className="font-bold text-sm">LAN Lord</p>
                <p className="text-[10px] text-white/40">Won 5 Valorant stacks</p>
              </div>
            </div>
            <div className="glassmorphism rounded-xl p-3 border border-[var(--color-neon-purple)]/30 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-neon-purple)]/10 to-transparent" />
              <div className="w-10 h-10 rounded-full bg-[var(--color-neon-purple)]/20 flex items-center justify-center z-10">
                🦉
              </div>
              <div className="z-10">
                <p className="font-bold text-sm">Night Owl</p>
                <p className="text-[10px] text-[var(--color-neon-purple)] font-medium">Equipped</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
