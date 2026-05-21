"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClient();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: "Magic link sent! Check your email to securely log in." });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An error occurred during login." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-bg-dark relative overflow-hidden px-6">
      
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[var(--color-neon-purple)] opacity-20 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[340px] z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 mb-6 relative">
          <img src="/logo.png" alt="OnCampus Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Welcome to OnCampus</h1>
        <p className="text-white/60 mb-10 text-center">Log in to join the scene.</p>

        {message?.type === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-[var(--color-neon-blue)]/10 border border-[var(--color-neon-blue)]/30 rounded-2xl p-6 flex flex-col items-center text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-neon-blue)]/20 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-[var(--color-neon-blue)]" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Check Your Email</h3>
              <p className="text-sm text-white/70">{message.text}</p>
            </div>
          </motion.div>
        ) : (
          <div className="w-full space-y-4">
            <button className="w-full py-4 rounded-xl glassmorphism border border-white/10 flex items-center justify-center gap-3 hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/40 text-sm">or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[var(--color-neon-blue)] focus:ring-1 focus:ring-[var(--color-neon-blue)] transition-all"
                />
              </div>
              
              {message?.type === 'error' && (
                <p className="text-red-400 text-xs px-2 text-center">{message.text}</p>
              )}

              <button 
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-4 rounded-xl bg-[var(--color-neon-blue)] text-black font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <p className="mt-8 text-xs text-white/40 text-center max-w-[280px]">
          By continuing, you agree to OnCampus Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
