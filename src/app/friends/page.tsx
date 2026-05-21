"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Check, X, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchFriendsData = async (myId: string) => {
    // We fetch all friendships where the user is involved
    const { data } = await supabase
      .from("friendships")
      .select("*, user1:profiles!user_id1(*), user2:profiles!user_id2(*)")
      .or(`user_id1.eq.${myId},user_id2.eq.${myId}`);

    if (data) {
      const activeFriends: any[] = [];
      const pendingReqs: any[] = [];

      data.forEach((row: any) => {
        // Determine who the "other" person is
        const isUser1 = row.user_id1 === myId;
        const otherUser = isUser1 ? row.user2 : row.user1;
        const mappedData = { ...row, friendProfile: otherUser };

        if (row.status === "accepted") {
          activeFriends.push(mappedData);
        } else if (row.status === "pending" && !isUser1) {
          // It's a pending request to ME (I am user_id2)
          pendingReqs.push(mappedData);
        }
      });

      setFriends(activeFriends);
      setRequests(pendingReqs);
    }
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      let { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        await fetchFriendsData(user.id);
      } else {
        setLoading(false);
      }
    };
    init();

    // Set up realtime subscription for friendship changes
    const channel = supabase.channel('friendships-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        if (currentUserId) fetchFriendsData(currentUserId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const respondToRequest = async (id: string, action: "accepted" | "rejected") => {
    if (action === "rejected") {
      await supabase.from("friendships").delete().eq("id", id);
    } else {
      await (supabase.from("friendships") as any).update({ status: "accepted" }).eq("id", id);
    }
    // Optimistic UI update handled by subscription
    if (currentUserId) fetchFriendsData(currentUserId);
  };

  const filteredFriends = friends.filter((f) => {
    const name = f.friendProfile?.full_name || f.friendProfile?.username || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[var(--color-neon-blue)] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header & Tabs */}
      <div className="px-6 py-4 z-10 shrink-0">
        <h1 className="text-2xl font-bold mb-4">Friends</h1>
        
        <div className="flex bg-white/5 rounded-xl p-1 mb-4">
          <button 
            onClick={() => setActiveTab("friends")}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
              activeTab === "friends" ? "bg-white text-black shadow-lg" : "text-white/60"
            )}
          >
            My Friends
          </button>
          <button 
            onClick={() => setActiveTab("requests")}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === "requests" ? "bg-white text-black shadow-lg" : "text-white/60"
            )}
          >
            Requests
            {requests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--color-neon-pink)] text-white text-[10px] flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "friends" && (
          <div className="relative glassmorphism rounded-xl border border-white/10 flex items-center px-4 focus-within:border-white/30 transition-colors">
            <Search size={18} className="text-white/40" />
            <input 
              type="text" 
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent py-3 pl-3 pr-2 text-white focus:outline-none placeholder-white/40 text-sm"
            />
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 z-10 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
          </div>
        ) : activeTab === "friends" ? (
          filteredFriends.length > 0 ? (
            <AnimatePresence>
              {filteredFriends.map((f, idx) => {
                const profile = f.friendProfile;
                const isFree = profile?.is_free;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={f.id}
                    onClick={() => router.push(`/user/${profile.id}`)}
                    className="w-full glassmorphism rounded-2xl p-4 border border-white/5 flex items-center gap-4 cursor-pointer hover:border-white/15 hover:bg-white/5 transition-all relative overflow-hidden"
                  >
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 rounded-full overflow-hidden border-2",
                        isFree ? "border-[var(--color-neon-pink)] glow-pink" : "border-white/20"
                      )}>
                        <img src={profile.avatar_url || "https://i.pravatar.cc/150?img=12"} alt="User" className="w-full h-full object-cover" />
                      </div>
                      {isFree && (
                        <div className="absolute -bottom-1 -right-1 bg-[var(--color-neon-pink)] rounded-full w-4 h-4 flex items-center justify-center border-2 border-bg-dark">
                          <Zap size={8} fill="white" className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-white truncate">{profile.full_name || profile.username}</h3>
                      <p className="text-xs text-white/50 truncate">@{profile.username}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
              <Users size={32} className="mb-4 text-white/40" />
              <p className="text-sm font-semibold">No friends found</p>
              <p className="text-xs max-w-[200px] mt-1">Start adding friends from the discover page or active scenes.</p>
            </div>
          )
        ) : (
          requests.length > 0 ? (
            <AnimatePresence>
              {requests.map((r) => {
                const profile = r.friendProfile;
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0 }}
                    key={r.id}
                    className="w-full glassmorphism rounded-2xl p-4 border border-white/10 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20" onClick={() => router.push(`/user/${profile.id}`)}>
                      <img src={profile.avatar_url || "https://i.pravatar.cc/150?img=13"} alt="User" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0" onClick={() => router.push(`/user/${profile.id}`)}>
                      <h3 className="font-bold text-sm text-white truncate">{profile.full_name || profile.username}</h3>
                      <p className="text-xs text-white/50 truncate">Wants to be friends</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => respondToRequest(r.id, "accepted")}
                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                      >
                        <Check size={20} />
                      </button>
                      <button 
                        onClick={() => respondToRequest(r.id, "rejected")}
                        className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
              <UserPlus size={32} className="mb-4 text-white/40" />
              <p className="text-sm font-semibold">No pending requests</p>
              <p className="text-xs max-w-[200px] mt-1">You're all caught up!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
