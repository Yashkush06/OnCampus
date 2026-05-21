"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, MessageCircle, User, Users, Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { name: "Home", href: "/feed", icon: Home },
  { name: "Friends", href: "/friends", icon: Users },
  { name: "Create", href: "/create", icon: PlusCircle, special: true },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pokeNotification, setPokeNotification] = useState<{ senderName: string, id: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null = null;
    
    supabase.auth.getUser().then(({ data }: { data: any }) => {
      if (data?.user) {
        currentUserId = data.user.id;
      }
    });

    const channel = supabase.channel('global-notifications')
      .on('broadcast', { event: 'poke' }, (payload: any) => {
        if (currentUserId && payload.payload.target_id === currentUserId) {
          const id = Date.now();
          setPokeNotification({ senderName: payload.payload.sender_name, id });
          setTimeout(() => {
            setPokeNotification(prev => prev?.id === id ? null : prev);
          }, 4000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Hide nav on landing, onboarding, auth pages, and live rooms
  if (
    pathname === "/" || 
    pathname === "/onboarding" || 
    pathname === "/login" ||
    pathname.startsWith("/room/")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="w-full max-w-md mx-auto">
        <div className="glassmorphism rounded-t-3xl border-b-0 px-4 pt-3 pb-5 flex items-end justify-between relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.special) {
              return (
                <Link key={item.name} href={item.href} className="flex flex-col items-center -mt-5">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center glow-blue border-4 border-[#0A0A0B]"
                  >
                    <Icon className="text-white" size={26} />
                  </motion.div>
                  <span className="text-[10px] font-medium mt-1 text-white/60">{item.name}</span>
                </Link>
              );
            }

            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center gap-1 min-w-[48px]">
                <div className="relative">
                  <Icon 
                    size={22} 
                    className={cn(
                      "transition-colors duration-300",
                      isActive ? "text-[var(--color-neon-blue)]" : "text-white/40"
                    )} 
                  />
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-indicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[var(--color-neon-blue)] glow-blue"
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors duration-300",
                  isActive ? "text-[var(--color-neon-blue)]" : "text-white/40"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Global Poke Toast */}
      <AnimatePresence>
        {pokeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 glassmorphism rounded-2xl px-5 py-3 flex items-center gap-3 border border-[var(--color-neon-blue)]/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] z-50 pointer-events-none"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-neon-blue)]/20 flex items-center justify-center shrink-0">
              <Hand size={18} className="text-[var(--color-neon-blue)] animate-bounce" />
            </div>
            <div className="flex flex-col whitespace-nowrap pr-2">
              <span className="text-sm font-bold text-white leading-tight">{pokeNotification.senderName} poked you!</span>
              <span className="text-xs text-white/60">Say hi back! 👋</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
