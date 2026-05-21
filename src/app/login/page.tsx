"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Show auth error from callback
  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setMessage({ type: 'error', text: 'Authentication failed. Please try again.' });
    }
  }, [searchParams]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || cooldown > 0) return;

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
        setCooldown(60);
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
        <div className="w-40 mb-6 relative rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.3)]">
          <img src="/logo.png" alt="OnCampus Logo" className="w-full h-auto object-contain" />
        </div>

        <h1 className="text-3xl font-bold mb-2 text-center">Welcome to OnCampus</h1>
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
            {cooldown > 0 ? (
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Clock size={14} />
                <span>Resend in {cooldown}s</span>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="text-sm text-[var(--color-neon-blue)] font-medium hover:underline"
              >
                Resend magic link
              </button>
            )}
          </motion.div>
        ) : (
          <div className="w-full space-y-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="College email" 
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center min-h-[100dvh] bg-bg-dark">
        <div className="w-8 h-8 rounded-full border-2 border-t-white border-white/10 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
