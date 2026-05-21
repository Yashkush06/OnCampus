"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, MapPin, Users, ChevronRight, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

export default function ChatInboxPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // 1. Resolve session
  useEffect(() => {
    const checkUser = async () => {
      let { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, [supabase]);

  // 2. Fetch joined scenes with their last messages
  useEffect(() => {
    if (!currentUserId) return;

    const fetchInbox = async () => {
      try {
        const { data, error } = await supabase
          .from('scene_participants')
          .select('scene:scenes(*, host:profiles(*), scene_participants(user_id))')
          .eq('user_id', currentUserId);
          
        if (data) {
          const rawScenes = data.map((item: any) => item.scene).filter(Boolean);
          
          // Concurrently fetch the latest message for each joined scene
          const scenesWithLastMessage = await Promise.all(
            rawScenes.map(async (scene: any) => {
              const { data: lastMsg } = await supabase
                .from('messages')
                .select('content, created_at')
                .eq('scene_id', scene.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
                
              return {
                ...scene,
                lastMessage: lastMsg || null
              };
            })
          );
          
          // Sort active hangouts by message timestamp or scene creation date (newest first)
          scenesWithLastMessage.sort((a: any, b: any) => {
            const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : new Date(a.created_at).getTime();
            const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : new Date(b.created_at).getTime();
            return timeB - timeA;
          });
          
          setInbox(scenesWithLastMessage);
        }
      } catch (err) {
        console.error("Error loading chat inbox:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInbox();

    // Subscribe to new message inserts to dynamically update the preview
    const channel = supabase
      .channel('chat-inbox-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchInbox();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scene_participants' },
        () => {
          fetchInbox();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const formatMessageTime = (timeString?: string) => {
    if (!timeString) return "";
    try {
      const d = new Date(timeString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[var(--color-neon-pink)] opacity-5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[200px] h-[200px] bg-[var(--color-neon-blue)] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 shrink-0 z-10">
        <h1 className="text-2xl font-bold">Chats</h1>
        <p className="text-xs text-white/40 mt-1">Your active campus hangouts</p>
      </div>

      {/* Inbox List */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-12 z-10 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
          </div>
        ) : inbox.length > 0 ? (
          <AnimatePresence>
            {inbox.map((scene, idx) => {
              const vibe = getVibeInfo(scene.vibe_tag);
              const joined = scene.scene_participants?.length || 1;
              const hasLastMsg = !!scene.lastMessage;
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  key={scene.id}
                  onClick={() => router.push(`/room/${scene.id}`)}
                  className="w-full glassmorphism rounded-2xl p-4 border border-white/5 flex items-center gap-4 cursor-pointer hover:border-white/15 hover:bg-white/5 active:scale-[0.99] transition-all relative overflow-hidden"
                >
                  {/* Neon vibe glowing indicator */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ 
                      backgroundColor: `${vibe.color}15`, 
                      border: `1px solid ${vibe.color}30`,
                      boxShadow: `0 0 10px ${vibe.color}20` 
                    }}
                  >
                    {vibe.icon}
                  </div>

                  {/* Room Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-sm text-white truncate pr-2">{scene.title}</h3>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {formatMessageTime(scene.lastMessage?.created_at || scene.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-white/50 truncate pr-6">
                      {hasLastMsg ? scene.lastMessage.content : "No messages yet. Say hi!"}
                    </p>

                    <div className="flex gap-3 mt-2 text-[10px] text-white/40">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {scene.location}</span>
                      <span className="flex items-center gap-1"><Users size={10} /> {joined} joined</span>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-white/20 shrink-0" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 opacity-40">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <MessageCircle size={24} className="text-white/40" />
            </div>
            <p className="text-sm font-semibold">No active chats</p>
            <p className="text-xs max-w-[200px] mt-1">Join scene rooms from the home feed or search to start messaging.</p>
            <Link href="/feed" className="mt-6">
              <button className="px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 font-bold text-xs bg-white/5 hover:bg-white/10 transition-all text-white">
                Find Scenes
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
