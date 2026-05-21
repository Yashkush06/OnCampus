"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Shield, UserPlus, UserCheck, Clock, UserMinus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [friendship, setFriendship] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id || null;
      setCurrentUserId(myId);

      // Redirect if it's our own profile
      if (myId === targetUserId) {
        router.push('/profile');
        return;
      }

      // Fetch target profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetUserId)
        .single();
        
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch friendship status if logged in
      if (myId) {
        const { data: friendshipData } = await supabase
          .from("friendships")
          .select("*")
          .or(`and(user_id1.eq.${myId},user_id2.eq.${targetUserId}),and(user_id1.eq.${targetUserId},user_id2.eq.${myId})`)
          .maybeSingle();
          
        setFriendship(friendshipData);
      }

      setLoading(false);
    };

    loadData();
  }, [targetUserId, supabase, router]);

  const handleAddFriend = async () => {
    if (!currentUserId || actionLoading) return;
    setActionLoading(true);

    const { data, error } = await supabase
      .from("friendships")
      .insert([{
        user_id1: currentUserId,
        user_id2: targetUserId,
        status: "pending"
      }] as any)
      .select()
      .single();

    if (!error && data) {
      setFriendship(data);
    }
    setActionLoading(false);
  };

  const handleRemoveOrCancel = async () => {
    if (!friendship || !currentUserId || actionLoading) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendship.id);

    if (!error) {
      setFriendship(null);
    }
    setActionLoading(false);
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
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-dark h-[100dvh] px-6 text-center">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <p className="text-white/50 mb-8">This user might not exist anymore.</p>
        <button onClick={() => router.back()} className="w-full py-3 rounded-xl bg-white text-black font-bold">
          Go Back
        </button>
      </div>
    );
  }

  const isFree = profile.is_free;

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark overflow-y-auto no-scrollbar relative">
      
      {/* Dynamic Background */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-[350px] pointer-events-none transition-all duration-1000",
        isFree ? "bg-gradient-to-b from-[var(--color-neon-pink)]/20 to-transparent" : "bg-gradient-to-b from-white/5 to-transparent"
      )} />

      {/* Header */}
      <div className="px-4 py-3 flex items-center z-10 sticky top-0">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full glassmorphism flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronLeft size={24} className="text-white" />
        </button>
      </div>

      <div className="px-6 z-10 flex flex-col items-center mt-2">
        {/* Avatar with Glowing Ring if Free */}
        <div className="relative mb-4">
          <div className={cn(
            "w-28 h-28 rounded-full p-1 transition-all duration-500",
            isFree 
              ? "border-4 border-[var(--color-neon-pink)] shadow-[0_0_25px_var(--color-neon-pink)]" 
              : "border-2 border-white/20"
          )}>
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-4xl overflow-hidden relative">
              <img src={profile.avatar_url || "https://i.pravatar.cc/150?img=68"} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          {isFree && (
            <div className="absolute bottom-0 right-0 bg-[var(--color-neon-pink)] text-black text-xs font-bold px-2 py-1 rounded-full border-2 border-bg-dark flex items-center gap-1 glow-pink">
              <Zap size={10} fill="black" /> FREE
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold">{profile.full_name || `@${profile.username}`}</h2>
        <p className="text-white/60 text-sm mb-1">@{profile.username}</p>
        <p className="text-white/60 flex items-center gap-1.5 mt-1 text-sm">
          <Shield size={14} className="text-[var(--color-neon-purple)]" /> 
          {profile.year || "N/A"} • {profile.branch || "N/A"}
        </p>

        {/* Action Button */}
        <div className="w-full mt-6 flex gap-3">
          {(!friendship) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddFriend}
              disabled={actionLoading || !currentUserId}
              className="flex-1 py-3 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2"
            >
              <UserPlus size={18} /> Add Friend
            </motion.button>
          )}

          {friendship?.status === 'pending' && friendship.user_id1 === currentUserId && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveOrCancel}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-2xl glassmorphism border border-white/20 text-white font-bold flex items-center justify-center gap-2"
            >
              <Clock size={18} /> Request Sent
            </motion.button>
          )}

          {friendship?.status === 'pending' && friendship.user_id2 === currentUserId && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={actionLoading}
              onClick={() => router.push('/friends')}
              className="flex-1 py-3 rounded-2xl bg-[var(--color-neon-blue)] text-black font-bold flex items-center justify-center gap-2"
            >
              Respond to Request
            </motion.button>
          )}

          {friendship?.status === 'accepted' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveOrCancel}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-2xl glassmorphism border border-[var(--color-neon-pink)] text-white font-bold flex items-center justify-center gap-2"
            >
              <UserCheck size={18} className="text-[var(--color-neon-pink)]" /> Friends
            </motion.button>
          )}
        </div>

        {/* User Stats / Badges (Display Only) */}
        <div className="w-full mt-10 text-left">
          <h3 className="font-bold text-lg mb-4 text-white/80">Campus Badges</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.badges || ['Pioneer']).map((badge: string, i: number) => (
              <div key={i} className="glassmorphism rounded-xl px-4 py-2 text-sm border border-white/10 font-medium">
                {badge}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
