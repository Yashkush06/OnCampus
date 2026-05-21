<div align="center">
  <h1>OnScene</h1>
  <p><strong>A real-time college social app where students can instantly create or join spontaneous hangouts, activities, and micro-events happening around campus.</strong></p>
</div>

## 🚀 The Core Idea
**“I’m free right now. Who’s doing something nearby?”**

Instead of endlessly scrolling social media or sitting alone during breaks, OnScene lets you open the app and instantly discover real people doing real things around campus. It's like a campus Discord mixed with real-life matchmaking and spontaneous event hosting—but hyperlocal and instant.

## ✨ Features
- **Live Campus Feed**: Real-time scenes around campus sorted by nearest, trending, or starting soon.
- **Host a Scene**: Instantly create events ("Free chai from me", "DSA Study Session").
- **Instant Join**: Jump right into a scene, no waiting for approval or awkward requests.
- **Room Experience**: Chat, share live locations, and plan with attendees in real-time.
- **Vibe Tags**: Discover scenes by tags like chill, study, gaming, food, sports, coding, and more.
- **"I'm Free" Mode**: Instantly get matched with scenes, people, or activities based on your current mood and availability.
- **Campus Heatmap**: Visual map of active groups and busy areas to create excitement and FOMO.
- **Social Reputation**: Earn gamified titles like "Chai King", "Study Demon", or "LAN Lord" based on your activity.
- **Temporary Rooms**: Scenes auto-delete after they end, keeping the feed fresh and spontaneity high.

## 🛠 Tech Stack
- **Framework**: [Next.js](https://nextjs.org) (App Router)
- **Styling**: Tailwind CSS & Framer Motion for smooth, modern animations
- **Backend/Auth**: Supabase (PostgreSQL, Realtime, Auth)
- **Icons**: Lucide React
- **PWA**: Next PWA support for native-like app installation
- **Language**: TypeScript

## 📦 Getting Started

First, install the dependencies:
```bash
npm install
```

Set up your environment variables by creating a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## 🎨 Design Philosophy
The UI follows a modern, dynamic, and Gen-Z-focused approach:
- **Rich Aesthetics**: Vibrant gradients, sleek dark mode, and glowing accents.
- **Dynamic Interactions**: Responsive hover effects and micro-animations for an engaging experience powered by Framer Motion.
- **Premium Feel**: Highly polished components avoiding generic defaults, drawing inspiration from platforms like Discord and Snapchat.

## 🛡 Safety & Moderation
Built specifically for safe college communities:
- Verified college accounts only
- Report and block mechanisms
- Private and public scene options
- Temporary content to prevent clutter and encourage in-the-moment participation

## 🤝 Contributing
Your feedback and contributions are welcome! This project thrives on community input to better serve college campuses and make real-life socialization easier.
