export const VIBE_METADATA: Record<string, { color: string; label: string; icon: string }> = {
  chill: { color: "var(--color-neon-blue)", label: "Chill", icon: "🍃" },
  study: { color: "var(--color-neon-purple)", label: "Study", icon: "📚" },
  gaming: { color: "var(--color-neon-pink)", label: "Gaming", icon: "🎮" },
  food: { color: "#FFB000", label: "Food", icon: "🍜" },
  sports: { color: "#00FF47", label: "Sports", icon: "⚽" },
  party: { color: "#FF0055", label: "Party", icon: "🎉" },
};

export const CATEGORIES = ["Nearby", "Chill", "Study", "Gaming", "Food", "Sports", "Party"];

export const getVibeInfo = (tag: string) => {
  const normalized = tag.toLowerCase();
  return VIBE_METADATA[normalized] || { color: "var(--color-neon-blue)", label: tag, icon: "✨" };
};

export const formatStartTime = (timeString: string) => {
  try {
    const d = new Date(timeString);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (Math.abs(diffMins) < 5) return "Live Now";
    if (diffMins > 0) {
      if (diffMins < 60) return `In ${diffMins} mins`;
      return `At ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) return `Started ${absMins}m ago`;
      return `Started at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  } catch (e) {
    return "Active Now";
  }
};
