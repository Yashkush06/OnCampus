"use client";

import { useState, useEffect, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MoreVertical, Send, Image as ImageIcon, MapPin, Smile, Share2, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";

const VIBE_COLORS: Record<string, string> = {
  chill: "var(--color-neon-blue)",
  study: "var(--color-neon-purple)",
  gaming: "var(--color-neon-pink)",
  food: "#FFB000",
  sports: "#00FF47",
  party: "#FF0055",
};

export default function LiveRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  
  const [scene, setScene] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage } = useChat(id);

  // 1. Resolve session and ensure profile exists on mount
  useEffect(() => {
    const checkUser = async () => {
      let { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    checkUser();
  }, [supabase]);

  // 2. Fetch scene details from the database
  useEffect(() => {
    const fetchSceneDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("scenes")
          .select("*, host:profiles!host_id(*), scene_participants(user_id)")
          .eq("id", id)
          .single();
          
        if (error) {
          console.error("Supabase error fetching scene details:", error);
          setFetchError(error.message);
        } else if (data) {
          setScene(data);
        }
      } catch (e: any) {
        console.error("JS Error fetching scene details:", e);
        setFetchError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSceneDetails();
  }, [id, supabase]);

  // 3. Auto-join user to scene_participants on mount
  useEffect(() => {
    if (!currentUserId || !scene) return;
    
    const joinScene = async () => {
      const isAlreadyJoined = scene.scene_participants?.some((p: any) => p.user_id === currentUserId);
      if (!isAlreadyJoined) {
        const { error } = await supabase
          .from("scene_participants")
          .insert([{
            scene_id: id,
            user_id: currentUserId,
          }] as any);
          
        if (!error) {
          setScene((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              scene_participants: [...(prev.scene_participants || []), { user_id: currentUserId }]
            };
          });
        }
      }
    };
    
    joinScene();

    // Cleanup: remove user from scene participants when they leave the room
    return () => {
      if (currentUserId && id) {
        supabase.from("scene_participants")
          .delete()
          .match({ scene_id: id, user_id: currentUserId })
          .then();
      }
    };
  }, [currentUserId, scene?.id, id, supabase]);

  // 4. Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    const content = newMessage;
    setNewMessage("");
    await sendMessage(content, currentUserId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUserId) return;
    
    setIsUploadingImage(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `chat-${currentUserId}-${Date.now()}.${fileExt}`;
    
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (error) {
        alert("Image upload failed. Please check your storage policies.");
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      // Send the image as a markdown string
      await sendMessage(`![image](${publicUrl})`, currentUserId);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleShareLocation = () => {
    if (!currentUserId || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await sendMessage(`![location](${latitude},${longitude})`, currentUserId);
      },
      (error) => {
        alert("Unable to retrieve your location: " + error.message);
      }
    );
  };

  const handleShareScene = async () => {
    if (!scene) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: scene.title,
          text: `Join the "${scene.title}" scene on OnCampus! 🚀`,
          url: url,
        });
      } catch (err) {
        console.log("User cancelled share or error:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Room link copied to clipboard!");
    }
  };

  const activeColor = scene 
    ? VIBE_COLORS[scene.vibe_tag.toLowerCase()] || "var(--color-neon-blue)" 
    : "var(--color-neon-blue)";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-bg-dark h-[100dvh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-white/80 border-white/10 animate-spin" />
          <p className="text-white/60 text-sm">Entering the scene...</p>
        </div>
      </div>
    );
  }

  if (!scene) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Scene not found</h2>
        <p className="text-white/50 mb-4">This hangout might have ended or been canceled.</p>
        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-8 text-sm max-w-sm">
            <span className="font-bold">Debug Info:</span> {fetchError}
          </div>
        )}
        <Link href="/feed" className="w-full max-w-[200px]">
          <button className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm">
            Back to Feed
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark relative overflow-hidden">
      {/* Top Ambient Glow */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[200px] opacity-15 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: activeColor }}
      />

      {/* Header */}
      <div className="px-4 py-3 glassmorphism border-b border-white/10 z-20 sticky top-0 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <Link href="/feed">
            <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
              <ChevronLeft size={24} className="text-white" />
            </button>
          </Link>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
              {scene.title}
            </h1>
            <p 
              className="text-xs font-medium flex items-center gap-1.5 transition-colors"
              style={{ color: activeColor }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: activeColor }} />
              {scene.scene_participants?.length || 1} joined
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleShareScene} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <Share2 size={18} className="text-white" />
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
            <MoreVertical size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Floating Info Pill */}
      <div className="w-full flex justify-center absolute top-20 left-0 z-10 pointer-events-none">
        <div className="glassmorphism px-4 py-1.5 rounded-full text-xs font-medium text-white/70 flex items-center gap-2 border border-white/5 shadow-xl">
          <MapPin size={12} /> {scene.location}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-16 pb-4 space-y-4 z-0 no-scrollbar">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-24 select-none">
              <span className="text-4xl mb-4">💬</span>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs max-w-[180px] mt-1">Start the conversation and break the ice!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isHost = msg.sender_id === scene.host_id;
              const senderName = isMe ? "Me" : (msg.sender?.username ? `@${msg.sender.username}` : "student");
              
              // Format time to HH:MM
              const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex flex-col w-full max-w-[85%]",
                    isMe ? "ml-auto items-end" : "items-start"
                  )}
                >
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1 pl-1">
                      <span className={cn(
                        "text-xs font-bold",
                        isHost ? "text-[var(--color-neon-pink)]" : "text-white/60"
                      )}>
                        {senderName}
                      </span>
                      {isHost && (
                        <span className="text-[9px] uppercase tracking-wider bg-[var(--color-neon-pink)]/20 text-[var(--color-neon-pink)] px-1.5 rounded-sm">
                          Host
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className={cn(
                    "px-4 py-2.5 rounded-2xl relative group",
                    isMe 
                      ? "bg-gradient-to-br from-[var(--color-neon-blue)] to-[#0090FF] text-white rounded-tr-sm shadow-[0_0_15px_rgba(0,240,255,0.2)]" 
                      : "glassmorphism rounded-tl-sm border border-white/5",
                    msg.content.startsWith("![image](") ? "p-1.5 bg-transparent border-none shadow-none" : ""
                  )}>
                    {msg.content.startsWith("![image](") ? (
                      <img 
                        src={msg.content.slice(9, -1)} 
                        alt="Sent photo" 
                        className="max-w-[220px] max-h-[300px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10 shadow-lg" 
                        onClick={() => window.open(msg.content.slice(9, -1), '_blank')}
                      />
                    ) : msg.content.startsWith("![location](") ? (
                      <a 
                        href={`https://maps.google.com/?q=${msg.content.slice(12, -1)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl transition-colors border",
                          isMe ? "bg-white/20 hover:bg-white/30 border-white/30" : "bg-black/20 hover:bg-black/30 border-white/10"
                        )}
                      >
                         <MapPin size={20} className={isMe ? "text-white" : "text-[var(--color-neon-blue)]"} />
                         <span className="text-sm font-bold">Live Location</span>
                      </a>
                    ) : (
                      <p className="text-[15px] leading-snug break-words">{msg.content}</p>
                    )}
                    
                    <span className={cn(
                      "text-[10px] absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                      isMe ? "right-1 text-white/50" : "left-1 text-white/40"
                    )}>
                      {msgTime}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Input Area */}
      <div className="px-4 py-3 pb-safe bg-bg-dark/90 backdrop-blur-xl border-t border-white/10 z-20">
        
        {/* Emoji Reactions Popover */}
        <AnimatePresence>
          {showReactions && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-[70px] right-4 glassmorphism p-2 rounded-full border border-white/10 flex gap-2 shadow-2xl z-30"
            >
              {['🔥', '💀', '💯', '😂', '👀'].map(emoji => (
                <button 
                  key={emoji} 
                  onClick={async () => {
                    setShowReactions(false);
                    if (currentUserId) {
                      await sendMessage(emoji, currentUserId);
                    }
                  }}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-xl hover:scale-125 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          <label className={cn(
            "w-10 h-10 rounded-full glassmorphism flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer relative",
            isUploadingImage ? "opacity-50 pointer-events-none" : "hover:bg-white/10"
          )}>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
            {isUploadingImage ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-white border-white/20 animate-spin" />
            ) : (
              <ImageIcon size={20} className="text-white/70" />
            )}
          </label>

          <button 
            onClick={handleShareLocation}
            className="w-10 h-10 rounded-full glassmorphism flex-shrink-0 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Navigation size={18} className="text-white/70" />
          </button>
          
          <div className="flex-1 glassmorphism rounded-3xl border border-white/10 flex items-center pr-1.5 focus-within:border-white/30 transition-colors">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message the scene..."
              className="flex-1 bg-transparent py-3 pl-4 text-[15px] focus:outline-none placeholder-white/40"
            />
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors mr-1"
            >
              <Smile size={18} className={showReactions ? "text-[var(--color-neon-pink)]" : "text-white/50"} />
            </button>
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={cn(
              "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300",
              newMessage.trim() 
                ? "bg-[var(--color-neon-blue)] glow-blue cursor-pointer" 
                : "glassmorphism opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={18} className={newMessage.trim() ? "text-black translate-x-[-1px] translate-y-[1px]" : "text-white/50"} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
