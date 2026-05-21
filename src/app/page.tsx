"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MapPin, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-bg-dark relative">
      {/* Background elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[500px] bg-[var(--color-neon-blue)] opacity-[0.15] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-[400px] bg-[var(--color-neon-purple)] opacity-[0.15] blur-[100px] rounded-full pointer-events-none" />

      <main className="relative z-10 px-6 pt-24 pb-12 flex flex-col items-center min-h-[100dvh]">
        {/* Header/Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-8 left-6"
        >
          <div className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-10 h-10 rounded-md overflow-hidden relative shadow-[0_0_15px_rgba(0,255,255,0.3)]">
              <img src="/logo.png" alt="OnCampus Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-gradient">OnCampus</span>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="mt-16 flex flex-col items-center text-center max-w-[340px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="px-4 py-1.5 rounded-full border border-white/10 glassmorphism mb-8 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-neon-blue)] animate-pulse shadow-[0_0_8px_var(--color-neon-blue)]" />
            <span className="text-sm font-medium text-white/80">2,419 students active now</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl font-bold leading-[1.1] tracking-tight mb-6"
          >
            Never spend breaks <span className="text-gradient">alone again.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-white/60 mb-10"
          >
            The real-time campus social network. Find spontaneous hangouts, gaming sessions, and study groups instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full flex flex-col gap-4"
          >
            <Link href="/login">
              <button className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-[0.98]">
                Get Started
                <ArrowRight size={20} />
              </button>
            </Link>
            <p className="text-xs text-white/40">Join the scene instantly</p>
          </motion.div>
        </div>

        {/* Floating Previews */}
        <div className="mt-20 w-full flex flex-col gap-4 relative">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7, type: "spring" }}
            className="glassmorphism p-4 rounded-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-neon-blue)]" />
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">🔥 Free Chai @ Tapri</h3>
              <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-md">Starts in 5m</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <MapPin size={14} /> Main Gate Tapri
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-600 border border-[#141416]" />
                ))}
              </div>
              <span className="text-xs text-[var(--color-neon-blue)] font-medium">+ 4 joined</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9, type: "spring" }}
            className="glassmorphism p-4 rounded-2xl border border-white/10 relative overflow-hidden ml-6"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-neon-purple)]" />
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">🎮 Valorant 5-stack</h3>
              <span className="text-xs font-medium px-2 py-1 bg-white/10 rounded-md text-[var(--color-neon-purple)]">Live Now</span>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-3">
              <MapPin size={14} /> Hostel B, Room 212
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-gray-600 border border-[#141416]" />
                ))}
              </div>
              <span className="text-xs text-white/60">3/5 players</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
