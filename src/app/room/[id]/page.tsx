"use client";

import { useState, useEffect, use, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Send, Image as ImageIcon, MapPin, Smile, Share2, Navigation, Users, UserPlus, Trash2, Mic, Square } from "lucide-react";
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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
          .select("*, host:profiles!host_id(*), scene_participants(user_id, profiles(username, avatar_url))")
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
          // Broadcast that we joined!
          await sendMessage("![system](joined)", currentUserId);
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

  // 3b. Subscribe to real-time participant changes
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase.channel(`participants-${id}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'scene_participants', filter: `scene_id=eq.${id}` }, 
        async (payload) => {
          // Fetch the new participant's profile
          const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', payload.new.user_id).single();
          
          setScene((prev: any) => {
            if (!prev) return prev;
            // Avoid duplicates if we already added them locally
            if (prev.scene_participants?.some((p: any) => p.user_id === payload.new.user_id)) return prev;
            
            return {
              ...prev,
              scene_participants: [...(prev.scene_participants || []), { user_id: payload.new.user_id, profiles: profile }]
            };
          });
        }
      )
      .on(
        'postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'scene_participants', filter: `scene_id=eq.${id}` }, 
        (payload) => {
          setScene((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              scene_participants: prev.scene_participants?.filter((p: any) => p.user_id !== payload.old.user_id) || []
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, supabase]);

  // Handle kicking
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return;
    const kickMessage = messages.find(m => m.content === `![kick](${currentUserId})`);
    if (kickMessage) {
      alert("You have been kicked from the room by the host.");
      router.push("/feed");
    }
  }, [messages, currentUserId, router]);

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

  const handleKickUser = async (userIdToKick: string) => {
    if (!currentUserId || currentUserId !== scene?.host_id) return;
    
    const confirmKick = window.confirm("Are you sure you want to kick this user?");
    if (!confirmKick) return;
    
    // 1. Remove them from participants
    await supabase.from("scene_participants")
      .delete()
      .match({ scene_id: id, user_id: userIdToKick });
      
    // 2. Broadcast the hidden kick command
    await sendMessage(`![kick](${userIdToKick})`, currentUserId);
    
    // 3. Close the drawer
    setShowParticipants(false);
  };

  const handleAddFriend = async (userIdToAdd: string) => {
    if (!currentUserId) return;
    
    const { error } = await supabase.from("friendships").insert([{
      user_id1: currentUserId,
      user_id2: userIdToAdd,
      status: "pending"
    }] as any);
    
    if (error) {
      alert("Failed to send friend request: " + error.message);
    } else {
      alert("Friend request sent!");
    }
  };

  const activeColor = scene 
    ? VIBE_COLORS[scene.vibe_tag.toLowerCase()] || "var(--color-neon-blue)" 
    : "var(--color-neon-blue)";

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadVoiceNote(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access denied or error occurred.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    if (audioBlob.size === 0) return;
    setIsUploadingAudio(true);
    const fileName = `voice-room-${currentUserId}-${Date.now()}.webm`;
    
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, audioBlob, { contentType: 'audio/webm', upsert: true });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await sendMessage(`![audio](${publicUrl})`, currentUserId);
    } catch (err: any) {
      alert("Voice note upload failed: " + err.message);
    } finally {
      setIsUploadingAudio(false);
    }
  };

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
          <button onClick={() => setShowParticipants(true)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors relative">
            <Users size={20} className="text-white" />
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
            messages.filter(msg => !msg.content.startsWith("![kick](")).map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const isHost = msg.sender_id === scene.host_id;
              const senderName = isMe ? "Me" : (msg.sender?.username ? `@${msg.sender.username}` : "student");
              
              // Format time to HH:MM
              const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              if (msg.content.startsWith("![system](")) {
                return (
                  <div key={msg.id} className="w-full flex justify-center my-2">
                    <span className="bg-white/10 text-white/50 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-white/5 shadow-sm">
                      {msg.content === "![system](joined)" ? `${senderName} joined the room` : "System message"}
                    </span>
                  </div>
                );
              }

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex w-full gap-2 items-end",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  {!isMe && (
                    <div 
                      onClick={() => router.push(`/user/${msg.sender_id}`)}
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0 mb-4 border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img src={msg.sender?.avatar_url || "https://i.pravatar.cc/150?img=68"} alt={senderName} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex flex-col max-w-[75%]",
                    isMe ? "items-end" : "items-start"
                  )}>
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
                         <MapPin size={20} className={isMe ? "text-white" : `text-[${VIBE_COLORS[scene?.vibe_tag || 'chill']}]`} />
                         <span className="text-sm font-bold">Live Location</span>
                      </a>
                    ) : msg.content.startsWith("![audio](") ? (
                      <div className="flex flex-col gap-1 w-[200px] sm:w-[250px]">
                        <audio controls className="w-full h-10 rounded-full" src={msg.content.slice(9, -1)} />
                      </div>
                    ) : (
                      <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                    )}
                    
                    <span className={cn(
                      "text-[10px] absolute -bottom-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                      isMe ? "right-1 text-white/50" : "left-1 text-white/40"
                    )}>
                      {msgTime}
                    </span>
                  </div>
                </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Input Area */}
      <div className="px-4 pt-3 pb-8 md:pb-4 bg-bg-dark/90 backdrop-blur-xl border-t border-white/10 z-20">
        
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

          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-10 h-10 rounded-full glassmorphism flex-shrink-0 flex items-center justify-center transition-all",
              isRecording ? "bg-red-500/20 text-red-500 glow-pink" : "hover:bg-white/10 text-white/70",
              isUploadingAudio ? "opacity-50 pointer-events-none" : ""
            )}
            disabled={isUploadingAudio}
          >
            {isUploadingAudio ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-white border-white/20 animate-spin" />
            ) : isRecording ? (
              <Square size={16} fill="currentColor" className="animate-pulse" />
            ) : (
              <Mic size={18} />
            )}
          </button>
          
          <div className="flex-1 min-w-0 glassmorphism rounded-3xl border border-white/10 flex items-center pr-1.5 focus-within:border-white/30 transition-colors">
            {isRecording ? (
              <div className="flex-1 bg-transparent py-3 pl-4 text-[15px] text-red-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </div>
            ) : (
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message the scene..."
                className="flex-1 min-w-0 bg-transparent py-3 pl-4 text-[15px] focus:outline-none placeholder-white/40"
              />
            )}
            {isRecording ? (
              <button 
                onClick={cancelRecording}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors mr-1 text-white/50 hover:text-white"
              >
                Cancel
              </button>
            ) : (
              <button 
                onClick={() => setShowReactions(!showReactions)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors mr-1"
              >
                <Smile size={18} className={showReactions ? "text-[var(--color-neon-pink)]" : "text-white/50"} />
              </button>
            )}
          </div>

          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={(!newMessage.trim() && !isRecording) || isRecording}
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

      {/* Participants Drawer */}
      <AnimatePresence>
        {showParticipants && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowParticipants(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 w-full h-[70vh] bg-bg-dark border-t border-white/10 z-50 rounded-t-3xl flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>
              
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={20} className="text-[var(--color-neon-blue)]" /> 
                  In this Room
                </h2>
                <span className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-bold text-white/70">
                  {scene.scene_participants?.length || 0}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 no-scrollbar">
                {scene.scene_participants?.map((p: any) => {
                  const isParticipantHost = p.user_id === scene.host_id;
                  const isParticipantMe = p.user_id === currentUserId;
                  const imHost = currentUserId === scene.host_id;
                  const profile = p.profiles || {};

                  return (
                    <div key={p.user_id} className="flex items-center justify-between p-3 glassmorphism rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full border overflow-hidden shrink-0",
                          isParticipantHost ? "border-[var(--color-neon-pink)] glow-pink" : "border-white/20"
                        )}>
                          <img src={profile.avatar_url || `https://i.pravatar.cc/150?u=${p.user_id}`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm flex items-center gap-2">
                            {isParticipantMe ? "You" : (profile.username ? `@${profile.username}` : "Participant")}
                            {isParticipantHost && (
                              <span className="text-[9px] uppercase tracking-wider bg-[var(--color-neon-pink)]/20 text-[var(--color-neon-pink)] px-1.5 py-0.5 rounded-md">Host</span>
                            )}
                          </span>
                          <span className="text-xs text-white/50 font-mono text-ellipsis overflow-hidden max-w-[120px]">
                            {p.user_id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {!isParticipantMe && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleAddFriend(p.user_id)}
                            className="w-8 h-8 rounded-full glassmorphism border border-white/10 flex items-center justify-center hover:bg-[var(--color-neon-blue)]/20 hover:text-[var(--color-neon-blue)] hover:border-[var(--color-neon-blue)]/50 transition-colors"
                            title="Add Friend"
                          >
                            <UserPlus size={14} />
                          </button>
                          
                          {imHost && !isParticipantHost && (
                            <button 
                              onClick={() => handleKickUser(p.user_id)}
                              className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                              title="Kick from Room"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
