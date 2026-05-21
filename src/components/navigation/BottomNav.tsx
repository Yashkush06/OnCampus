"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
  { name: "Home", href: "/feed", icon: Home },
  { name: "Friends", href: "/friends", icon: Users },
  { name: "Create", href: "/create", icon: PlusCircle, special: true },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

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
        <div className="glassmorphism rounded-t-3xl border-b-0 px-6 py-4 flex items-center justify-between relative">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.special) {
              return (
                <Link key={item.name} href={item.href} className="relative -top-6">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-purple)] flex items-center justify-center glow-blue border-2 border-[#0A0A0B]"
                  >
                    <Icon className="text-white" size={28} />
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link key={item.name} href={item.href} className="relative flex flex-col items-center justify-center w-12 h-12">
                <Icon 
                  size={24} 
                  className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-[var(--color-neon-blue)]" : "text-gray-500"
                  )} 
                />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-2 w-1 h-1 rounded-full bg-[var(--color-neon-blue)] glow-blue"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
