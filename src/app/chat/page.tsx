"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, MapPin, Smile, Globe2, Mic, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// This is the actual Chat Room UI
function GlobalChatRoom({ sceneId, currentUserId }: { sceneId: string, currentUserId: string }) {
  const [newMessage, setNewMessage] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const { messages, sendMessage } = useChat(sceneId);

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
    const fileName = `global-${currentUserId}-${Date.now()}.${fileExt}`;
    
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (error) {
        alert("Image upload failed.");
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await sendMessage(`![image](${publicUrl})`, currentUserId);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

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
      audioChunksRef.current = []; // Clear chunks so upload isn't triggered or is empty
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const uploadVoiceNote = async (audioBlob: Blob) => {
    if (audioBlob.size === 0 || !currentUserId) return;
    setIsUploadingAudio(true);
    const fileName = `voice-global-${currentUserId}-${Date.now()}.webm`;
    
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
        alert("Unable to retrieve location: " + error.message);
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark pt-12 pb-24 overflow-hidden relative">
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[var(--color-neon-blue)] opacity-5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[200px] h-[200px] bg-[var(--color-neon-pink)] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 shrink-0 z-10 flex items-center gap-3 bg-bg-dark/80 backdrop-blur-md">
        <div className="w-12 h-12 rounded-full glassmorphism flex items-center justify-center bg-[var(--color-neon-blue)]/10 border border-[var(--color-neon-blue)]/30 shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Globe2 size={24} className="text-[var(--color-neon-blue)]" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold flex items-center gap-2">Campus Global Chat</h1>
          <p className="text-xs text-[var(--color-neon-blue)] font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse bg-[var(--color-neon-blue)]" />
            Everyone is here
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-4 z-0 no-scrollbar">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-24 select-none">
              <span className="text-4xl mb-4">🌍</span>
              <p className="text-sm font-medium">Welcome to the Global Chat</p>
              <p className="text-xs max-w-[180px] mt-1">Say hi to everyone on campus!</p>
            </div>
          ) : (
            messages.filter(msg => !msg.content.startsWith("![kick](")).map((msg) => {
              const isMe = msg.sender_id === currentUserId;
              const senderName = isMe ? "Me" : (msg.sender?.username ? `@${msg.sender.username}` : "student");
              const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              if (msg.content.startsWith("![system](")) return null;

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
                        <span className="text-xs font-bold text-white/60">{senderName}</span>
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

      {/* Input Area */}
      <div className="px-4 pt-3 pb-8 md:pb-4 bg-bg-dark/90 backdrop-blur-xl border-t border-white/10 z-20">
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
                placeholder="Message the campus..."
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
    </div>
  );
}

// Wrapper to provision the global scene
export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [globalSceneId, setGlobalSceneId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 1. Check if "Global Campus Chat" exists
      const { data: existingScene } = await supabase
        .from("scenes")
        .select("id")
        .eq("title", "Global Campus Chat")
        .maybeSingle();

      if (existingScene) {
        setGlobalSceneId((existingScene as any).id);
      } else {
        // 2. If it doesn't exist, create it!
        const { data: newScene, error } = await supabase
          .from("scenes")
          .insert([{
            host_id: user.id,
            title: "Global Campus Chat",
            vibe_tag: "chill",
            location: "Everywhere",
            is_active: true,
            start_time: new Date().toISOString()
          }] as any)
          .select()
          .single();

        if (newScene) {
          setGlobalSceneId((newScene as any).id);
        }
      }
    };
    init();
  }, [supabase]);

  if (!globalSceneId || !currentUserId) {
    return (
      <div className="flex-1 flex flex-col h-[100dvh] bg-bg-dark items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin mb-4" />
        <p className="text-white/50 text-sm font-medium animate-pulse">Connecting to Global Chat...</p>
      </div>
    );
  }

  return <GlobalChatRoom sceneId={globalSceneId} currentUserId={currentUserId} />;
}
