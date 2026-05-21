"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.2)]",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]",
  },
  info: {
    icon: Info,
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(0,240,255,0.2)]",
  },
};

export function Toast({ message, type, onDismiss, duration = 4000 }: ToastProps) {
  const [visible, setVisible] = useState(true);
  const c = toastConfig[type];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${c.bg} ${c.border} ${c.glow}`}
        >
          <Icon size={18} className={`${c.text} shrink-0`} />
          <p className="text-sm text-white/90 font-medium flex-1">{message}</p>
          <button onClick={() => setVisible(false)} className="text-white/40 hover:text-white/70 transition-colors shrink-0">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
