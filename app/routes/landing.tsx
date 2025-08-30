import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, motion as m, type TargetAndTransition } from "framer-motion";
import { KimuLogo } from "../components/ui/KimuLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Folder,
  Download,
  Scissors,
  Copy,
  Undo,
  Redo,
  Video,
  Music,
  Image,
  Type,
  Layers,
  Sparkles,
  Wand2,
  ArrowRight,
  Github,
  Monitor,
  Zap,
  Heart,
  Shield,
  Bot,
  User,
  Cloud,
} from "lucide-react";

import { TbBrandDiscord } from "react-icons/tb";
import { GlowingEffect } from "~/components/ui/glowing-effect";
import { FollowerPointerCard } from "../components/ui/following-pointer";

// Vite envs for Supabase
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// @ts-ignore
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

async function getIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch {
    return "unknown";
  }
}

async function getWaitlistCount() {
  try {
    const base = SUPABASE_URL || "";
    const url = `${base.replace(/\/$/, "")}/rest/v1/waitlist?select=count`;
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      },
    });

    const count = res.headers.get("Content-Range");
    if (count) {
      const match = count.match(/\/(\d+)$/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

// Helper function to format creator count
function formatCreatorCount(count: number): string | null {
  if (count < 100) return null;
  if (count < 200) return "100+";
  if (count < 300) return "200+";
  if (count < 400) return "300+";
  if (count < 500) return "400+";
  if (count < 1000) return Math.floor(count / 100) * 100 + "+";
  return Math.floor(count / 1000) + "k+";
}

export default function Landing() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoSpinning, setLogoSpinning] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number>(0);
  const [countLoading, setCountLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [gitHubStars, setGitHubStars] = useState<number>(0);
  const gifMaskStyle: React.CSSProperties = {
    // backgroundImage: "url('https://i1.wp.com/68.media.tumblr.com/7c6a7e8721763add9fd8138e1a95880b/tumblr_ove0utGygC1uzwgsuo1_400.gif')",
    backgroundImage:
      "url('https://cdn.dribbble.com/userupload/24426263/file/original-52cf3a971cd1054bf2985d8f34a9a056.gif')",
    backgroundSize: "cover",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };

  useEffect(() => {
    const fetchCount = async () => {
      setCountLoading(true);
      const count = await getWaitlistCount();
      setWaitlistCount(count);
      setCountLoading(false);
    };

    const fetchGitHubStars = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/trykimu/videoeditor");
        const data = await res.json();
        setGitHubStars(data.stargazers_count || 0);
      } catch (error) {
        console.log("Failed to fetch GitHub stars");
      }
    };

    fetchCount();
    fetchGitHubStars();
  }, []);

  // Calculate totalDuration as the end of the last asset
  const timelineAssets = [
    {
      label: "Intro",
      color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
      icon: <Video className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-white">Think "vibe coding,"</span>
          <br />
          <span className="text-white/80">but for video editing</span>
        </>
      ),
      desc: "A new way to edit. Effortless, playful, and powerful.",
      subtext: "Creators save time while Kimu handles the heavy lifting.",
      subtext2: "For creators who'd rather be creating. If editing drains you — Kimu gives your time back.",
      badges: ["AI-Powered", "Instant Preview", "Creator DNA"],
      start: 0,
      duration: 30,
      animation: {
        initial: { opacity: 0, scale: 0.8, y: 40 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.8, y: -40 },
      },
    },
    {
      label: "Built for Creators",
      color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
      icon: <Sparkles className="w-3 h-3 text-yellow-400 mr-1" />, // yellow
      heading: (
        <>
          <span className="text-yellow-400">Built for creators,</span>
          <br />
          <span className="text-white">by creators</span>
        </>
      ),
      desc: "Every feature designed to get out of your way and let creativity flow.",
      subtext: "We obsess over details so you can focus on your story.",
      subtext2: "A tool that feels like an extension of your imagination.",
      badges: ["Creator-first", "Intuitive", "Community-driven"],
      start: 30,
      duration: 30,
      animation: {
        initial: { opacity: 0, x: -80, scale: 0.7 },
        animate: { opacity: 1, x: 0, scale: 1 },
        exit: { opacity: 0, x: 80, scale: 0.7 },
      },
    },
    {
      label: "Instant Preview",
      color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
      icon: <Zap className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-blue-400">Instant Preview</span>
        </>
      ),
      desc: "Real-time editing with instant preview. Every cut happens immediately.",
      subtext: "No more waiting. See your changes as you make them.",
      subtext2: "Edit at the speed of thought.",
      badges: ["Instant Preview", "No Waiting", "Realtime"],
      start: 60,
      duration: 30,
      animation: {
        initial: { opacity: 0, scale: 0.5, rotate: -10 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        exit: { opacity: 0, scale: 0.5, rotate: 10 },
      },
    },
    {
      label: "AI Assistant",
      color: "bg-purple-500/20 border-purple-500/30 text-purple-400",
      icon: <Wand2 className="w-3 h-3 text-purple-400 mr-1" />, // purple
      heading: (
        <>
          <span className="text-purple-400">AI Assistant</span>
        </>
      ),
      desc: "Smart suggestions that learn your style and automate repetitive tasks.",
      subtext: "Kimu Copilot helps you edit faster with smart, context-aware suggestions.",
      subtext2: "Automate the boring, focus on the magic.",
      badges: ["AI Copilot", "Smart Suggestions", "Automation"],
      start: 90,
      duration: 30,
      animation: {
        initial: { opacity: 0, y: 60, scale: 0.7 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -60, scale: 0.7 },
      },
    },
    {
      label: "Creator DNA",
      color: "bg-pink-500/20 border-pink-500/30 text-pink-400",
      icon: <Heart className="w-3 h-3 text-pink-400 mr-1" />, // pink
      heading: (
        <>
          <span className="text-pink-400">Creator DNA</span>
        </>
      ),
      desc: "Intuitive interface that feels like an extension of your creativity.",
      subtext: "Personalized, playful, and powerful.",
      subtext2: "Designed for creators, by creators.",
      badges: ["Personalized", "Intuitive UI", "Playful"],
      start: 120,
      duration: 34,
      animation: {
        initial: { opacity: 0, scale: 0.6, x: 60 },
        animate: { opacity: 1, scale: 1, x: 0 },
        exit: { opacity: 0, scale: 0.6, x: -60 },
      },
    },
    {
      label: "Vibe Engine",
      color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
      icon: <Sparkles className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-blue-400">Vibe Engine</span>
        </>
      ),
      desc: "Transform raw footage into polished stories with one-click magic.",
      subtext: "Let Kimu handle the technicals while you focus on the vibe.",
      subtext2: "One-click story magic for creators.",
      badges: ["Vibe Engine", "One-click Magic", "Story Polishing"],
      start: 154,
      duration: 30,
      animation: {
        initial: { opacity: 0, scale: 0.7, y: 80 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.7, y: -80 },
      },
    },
  ];
  // Calculate totalDuration as the end of the last asset
  const totalDuration =
    timelineAssets.length > 0
      ? timelineAssets[timelineAssets.length - 1].start + timelineAssets[timelineAssets.length - 1].duration
      : 0;

  // Use totalDuration for playhead looping
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => (prev >= totalDuration ? 0 : prev + 1));
      }, 120); // slowed down by 20%
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Use totalDuration for progress bar
  const progress = (currentTime / totalDuration) * 100;

  // Use totalDuration for timeline block widths and playhead
  const activeAssetIndex = timelineAssets.findIndex(
    (asset, i) => currentTime >= asset.start && currentTime < asset.start + asset.duration,
  );
  const activeAsset = timelineAssets[activeAssetIndex] || timelineAssets[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    const ip = await getIp();
    try {
      const res = await fetch("https://<SUPABASE_URL>.supabase.co/rest/v1/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, ip_address: ip }),
      });
      if (res.ok) {
        setSuccess(true);
        setEmail("");
        setWaitlistCount((prev) => prev + 1);
        toast.success("You're on the waitlist!");
      } else {
        toast.error("Failed to join waitlist. Try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogoClick = () => {
    setLogoSpinning(true);
    try {
      // Use AudioContext with proper feature detection, no 'window as any'
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) throw new Error("Web Audio API not supported");
      const audioContext = new AudioCtx();

      const createTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      createTone(659.25, now, 0.4);
      createTone(783.99, now + 0.1, 0.3);
      createTone(987.77, now + 0.2, 0.2);
    } catch (error) {
      console.log("Audio not supported");
    }

    setTimeout(() => {
      setLogoSpinning(false);
    }, 1000);
  };

  const formattedCreatorCount = formatCreatorCount(waitlistCount);

  // Sample copilot chat messages
  const sampleChat = [
    {
      id: 1,
      isUser: false,
      content: "Hi! I'm Kimu Copilot. How can I help you edit your video today?",
      timestamp: new Date(),
    },
    {
      id: 2,
      isUser: true,
      content: "Can you trim the first 10 seconds?",
      timestamp: new Date(),
    },
    {
      id: 3,
      isUser: false,
      content: "Done! The first 10 seconds have been trimmed from your timeline.",
      timestamp: new Date(),
    },
    {
      id: 4,
      isUser: true,
      content: "Add a fade-in effect to the intro clip.",
      timestamp: new Date(),
    },
    {
      id: 5,
      isUser: false,
      content: "Fade-in effect added to the intro. Anything else?",
      timestamp: new Date(),
    },
  ];

  // Features array for the stepper
  const features = [
    {
      title: "Instant Preview",
      desc: "Real-time editing with instant preview. Every cut happens immediately.",
      icon: <Zap className="w-6 h-6" />,
    },
    {
      title: "AI Assistant",
      desc: "Smart suggestions that learn your style and automate repetitive tasks.",
      icon: <Wand2 className="w-6 h-6" />,
    },
    {
      title: "Creator DNA",
      desc: "Intuitive interface that feels like an extension of your creativity.",
      icon: <Heart className="w-6 h-6" />,
    },
    {
      title: "Vibe Engine",
      desc: "Transform raw footage into polished stories with one-click magic.",
      icon: <Sparkles className="w-6 h-6" />,
    },
  ];

  const [featureIndex, setFeatureIndex] = useState(0);
  const [featureAutoPlay, setFeatureAutoPlay] = useState(true);

  // Sync feature stepper with video play state
  useEffect(() => {
    if (!featureAutoPlay) return;
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (isPlaying ? (prev + 1) % features.length : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [isPlaying, featureAutoPlay, features.length]);

  // In the timeline logic, calculate the current feature section based on playhead
  const timelineSections = features.length;
  const timelineDuration = 154; // seconds (from earlier code)
  const sectionLength = timelineDuration / timelineSections;
  const currentFeatureIndex = Math.floor(currentTime / sectionLength) % features.length;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Main Content */}
      <div className="pt-20">
        {/* Logo and Title Section - Left Aligned */}
        <section id="hero-section" className="py-12 relative">
          {/* Decorative background */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-[1000px] bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-pink-500/15 blur-3xl rounded-full" />
            <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-6">
              <motion.div
                onClick={handleLogoClick}
                animate={{ rotate: logoSpinning ? 360 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                <KimuLogo className="w-16 h-16 text-foreground" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Kimu</h1>
            </motion.div>
            <div className="mt-4 max-w-4xl">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
                <span className="block bg-clip-text text-transparent" style={gifMaskStyle}>
                  Supercharging
                </span>
                <span className="block bg-clip-text text-transparent" style={gifMaskStyle}>
                  Creator Productivity
                </span>
              </h2>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">
                Kimu is a playful, zero‑latency video editor with an AI copilot. Create, upload and edit at the speed of
                thought.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/login">
                  <Button className="bg-foreground text-background hover:bg-foreground/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                {/* Roadmap CTA removed per request */}
                {gitHubStars > 0 && (
                  <div className="ml-1 text-xs text-muted-foreground border border-border/30 rounded-full px-3 py-1">
                    {gitHubStars} GitHub stars
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Video Editor Interface Section */}
        <section className="py-8 relative">
          <div className="max-w-7xl mx-auto px-0">
            <div className="relative">
              {/* removed bg gradient per request */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-xl overflow-hidden z-10">
                {/* Top Menu Bar */}
                <div className="h-12 bg-muted/10 border-b border-border/20 hidden sm:flex items-center px-6 text-sm relative z-10">
                  <div className="flex items-center gap-2 mr-8">
                    <KimuLogo className="w-5 h-5 text-foreground" />
                    <span className="font-medium">Kimu Studio</span>
                  </div>

                  <div className="flex items-center gap-6 text-muted-foreground text-xs">
                    <button className="hover:text-foreground transition-colors">File</button>
                    <button className="hover:text-foreground transition-colors">Edit</button>
                    <button className="hover:text-foreground transition-colors">View</button>
                    <button className="hover:text-foreground transition-colors">Project</button>
                  </div>
                </div>

                {/* Mobile player (standalone) */}
                <div className="sm:hidden w-full">
                  <MobileVideoEditorPreview
                    timelineAssets={timelineAssets}
                    handleLogoClick={handleLogoClick}
                    logoSpinning={logoSpinning}
                    email={email}
                    setEmail={setEmail}
                    loading={loading}
                    success={success}
                    handleSubmit={handleSubmit}
                    waitlistCount={waitlistCount}
                  />
                </div>

                {/* Main Editor Layout - Desktop/tablet only */}
                <div className="hidden sm:flex flex-col sm:flex-row h-auto sm:h-[650px] lg:h-[700px]">
                  {/* Left Sidebar - Media Bin with Much More Translucent Elements */}
                  <div className="hidden md:flex xl:flex ipadmini:hidden w-full sm:w-56 bg-background/25 backdrop-blur-sm sm:border-r border-border/20 flex-col gap-6 p-4 sm:h-full min-w-0">
                    <div className="h-10 bg-background/60 backdrop-blur-sm border-b border-border/20 flex items-center px-3 text-xs font-medium rounded-xl opacity-25 mb-3">
                      <Folder className="w-4 h-4 mr-2 text-blue-500" />
                      Media Library
                    </div>
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                      <div className="bg-background/25 backdrop-blur-sm border border-border/20 rounded-xl p-4 shadow-md flex flex-col gap-3 opacity-25">
                        {[
                          { icon: Video, name: "Vibe_Coding.mp4", duration: "2:34", color: "text-blue-500" },
                          { icon: Music, name: "Lo_Fi_Beats.mp3", duration: "1:45", color: "text-green-500" },
                          { icon: Image, name: "Code_Editor.png", duration: "", color: "text-purple-500" },
                          { icon: Type, name: "Title_Card.txt", duration: "", color: "text-orange-500" },
                        ].map((item, i) => (
                          <motion.div
                            key={item.name}
                            className="flex items-center gap-3 p-2 rounded bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}>
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">{item.name}</div>
                              {item.duration && <div className="text-xs text-muted-foreground">{item.duration}</div>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {/* Export Settings Card, translucent, full width, aligned */}
                      <div className="bg-background/25 backdrop-blur-sm border border-border/20 rounded-xl p-4 shadow-md flex flex-col gap-2 opacity-25 mt-2">
                        <div className="font-semibold text-foreground mb-2">Export Settings</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Format: MP4</div>
                          <div>Quality: 4K (60fps)</div>
                          <div>Audio: 320 kbps</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Content */}
                  <div className="flex-1 flex flex-col min-w-0 order-first sm:order-none">
                    {/* Mobile Player (replaces desktop preview on small screens) */}
                    <div className="sm:hidden w-full">
                      <MobileVideoEditorPreview
                        timelineAssets={timelineAssets}
                        handleLogoClick={handleLogoClick}
                        logoSpinning={logoSpinning}
                        email={email}
                        setEmail={setEmail}
                        loading={loading}
                        success={success}
                        handleSubmit={handleSubmit}
                        waitlistCount={waitlistCount}
                      />
                    </div>
                    {/* Desktop Preview Window */}
                    <div className="hidden sm:flex flex-1 bg-black/90 relative flex-col items-center justify-center w-full h-full min-h-[300px] min-w-0">
                      {/* Main Content - Strictly centered, with reserved space for play bar */}
                      <div className="flex-1 flex flex-col justify-center items-center text-center px-2 md:px-6 lg:px-12 pt-8 pb-20 w-full h-full overflow-hidden">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={activeAssetIndex}
                            initial={activeAsset.animation.initial}
                            animate={activeAsset.animation.animate}
                            exit={activeAsset.animation.exit}
                            transition={{ type: "spring", stiffness: 80, damping: 22, duration: 1.1 }}
                            className="w-full flex flex-col items-center justify-center"
                            style={{ minHeight: 340, paddingTop: 24, paddingBottom: 24 }}>
                            <div className="flex flex-col items-center w-full">
                              <motion.div
                                key={activeAssetIndex + "-icon"}
                                initial={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.7, filter: "blur(8px)" }}
                                transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.12 }}
                                className="mb-4"
                                style={{ fontSize: 44 }}>
                                {activeAsset.icon}
                              </motion.div>
                              <motion.h2
                                key={activeAssetIndex + "-title"}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1.15 }}
                                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                                transition={{ delay: 0.18, duration: 0.7 }}
                                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white text-center drop-shadow-lg mb-4"
                                style={{
                                  fontFamily: "Montserrat, Poppins, Arial, sans-serif",
                                  letterSpacing: "-0.01em",
                                  lineHeight: 1.1,
                                }}>
                                {typeof activeAsset.heading === "string" ? activeAsset.heading : activeAsset.heading}
                              </motion.h2>
                              <motion.p
                                key={activeAssetIndex + "-desc"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ delay: 0.25, duration: 0.7 }}
                                className="text-lg md:text-xl text-zinc-200 text-center max-w-2xl font-semibold mb-6"
                                style={{ fontFamily: "Inter, system-ui, Arial, sans-serif", letterSpacing: "-0.01em" }}>
                                {activeAsset.desc || ""}
                              </motion.p>
                            </div>
                            <div className="flex flex-col items-center gap-2 w-full mb-2">
                              <p
                                className="text-base md:text-lg text-zinc-300 text-center max-w-2xl font-medium mb-1"
                                style={{ fontFamily: "Inter, system-ui, Arial, sans-serif" }}>
                                {activeAsset.subtext}
                              </p>
                              <p
                                className="text-sm md:text-base text-zinc-400 text-center max-w-xl font-normal"
                                style={{ fontFamily: "Inter, system-ui, Arial, sans-serif" }}>
                                {activeAsset.subtext2}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3 w-full min-h-[48px] mt-6">
                              {activeAsset.badges.map((badge, i) => (
                                <Badge
                                  key={badge}
                                  className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs md:text-sm py-2 px-4 animate-pulse">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {/* Play bar and controls at the bottom, always visible and full width, fixed height */}
                      <div className="absolute left-0 right-0 bottom-0 h-16 flex items-end">
                        <div className="w-full bg-black/70 backdrop-blur-md p-2 border-t border-white/10 flex flex-col justify-end">
                          {/* Progress bar (seek bar) */}
                          <div className="w-full h-0.5 mb-2 bg-white/10 rounded-full overflow-hidden flex items-center">
                            <motion.div
                              className="h-0.5 bg-white rounded-full transition-all duration-200"
                              style={{ width: `${progress}%` }}
                              animate={{ width: `${progress}%` }}
                              transition={{ type: "spring", stiffness: 120, damping: 18 }}
                            />
                          </div>
                          {/* Play bar controls */}
                          <div className="flex items-center gap-2 text-white text-sm w-full justify-between">
                            <div className="flex items-center gap-2">
                              <button className="hover:text-white/70 transition-colors p-1">
                                <SkipBack className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="hover:text-white/80 transition-colors p-1">
                                {isPlaying ? (
                                  <Pause className="w-5 h-5 text-white" />
                                ) : (
                                  <Play className="w-5 h-5 text-white" />
                                )}
                              </button>
                              <button className="hover:text-white/70 transition-colors p-1">
                                <SkipForward className="w-4 h-4" />
                              </button>
                            </div>
                            <span className="text-xs text-white/70 font-mono">
                              {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, "0")} / 2:34
                            </span>
                            <div className="flex items-center gap-2">
                              <button className="hover:text-white/70 transition-colors p-1">
                                <Volume2 className="w-4 h-4" />
                              </button>
                              <button className="hover:text-white/70 transition-colors p-1">
                                <Maximize className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tools Panel */}
                    <div className="h-12 bg-muted/10 border-y border-border/20 flex items-center px-4 gap-2">
                      <div className="flex items-center gap-1">
                        {[
                          { icon: Scissors, label: "Cut" },
                          { icon: Copy, label: "Copy" },
                          { icon: Undo, label: "Undo" },
                          { icon: Redo, label: "Redo" },
                        ].map((tool, i) => (
                          <button
                            key={tool.label}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
                            title={tool.label}>
                            <tool.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>

                      <div className="w-px h-6 bg-border/30 mx-2" />

                      <div className="flex items-center gap-1">
                        {[
                          { icon: Layers, label: "Layers" },
                          { icon: Sparkles, label: "Effects" },
                          { icon: Type, label: "Text" },
                          { icon: Wand2, label: "AI Tools" },
                        ].map((tool, i) => (
                          <button
                            key={tool.label}
                            className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
                            title={tool.label}>
                            <tool.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="h-20 bg-muted/20 border-t border-border/20 opacity-90 relative pb-2">
                      <div className="h-full flex">
                        {/* Track Labels */}
                        <div className="w-20 bg-muted/10 border-r border-border/20">
                          <div className="h-12 border-b border-border/20 flex items-center px-2">
                            <span className="text-xs text-muted-foreground">Video</span>
                          </div>
                        </div>

                        {/* Timeline Content */}
                        <div className="flex-1 relative">
                          {/* Ruler */}
                          <div className="absolute top-0 left-0 right-0 h-4 bg-muted/5 border-b border-border/20 flex text-xs">
                            {Array.from({ length: 8 }, (_, i) => (
                              <div
                                key={`ruler-${i}`}
                                className="flex-1 border-r border-border/20 px-1 text-muted-foreground">
                                {i * 20}s
                              </div>
                            ))}
                          </div>

                          {/* Single Video Track with multiple assets */}
                          <div
                            className="absolute top-4 left-0 right-0 h-12 border-b border-border/20 p-1 flex items-center"
                            style={{ gap: "8px" }}>
                            {timelineAssets.map((asset, i) => {
                              const widthPercent = (asset.duration / totalDuration) * 100;
                              const width = `${widthPercent}%`;
                              return (
                                <motion.div
                                  key={asset.label}
                                  className={`h-full rounded flex items-center px-2 pr-3 opacity-60 hover:opacity-80 transition-opacity cursor-pointer border overflow-hidden ${asset.color}`}
                                  style={{ width, minWidth: 0 }}
                                  initial={{ width: 0 }}
                                  animate={{ width }}
                                  transition={{ duration: 1, delay: 0.8 + i * 0.1 }}>
                                  <div className="flex items-center gap-1 min-w-0 w-full">
                                    {asset.icon}
                                    {widthPercent > 5 && (
                                      <span
                                        className={`text-xs ${asset.color.split(" ")[2]} truncate`}
                                        title={typeof asset.label === "string" ? asset.label : ""}>
                                        {asset.label}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Playhead */}
                          <motion.div
                            className="absolute top-4 bottom-0 w-px bg-red-500 z-10"
                            animate={{ left: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 120, damping: 18 }}>
                            <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rotate-45" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right Sidebar - Inspector Panel (wider) */}
                  <div className="min-w-[220px] max-w-[320px] w-full bg-background/25 backdrop-blur-sm border-l border-border/20 flex flex-col gap-4 p-3 h-full ipadmini:min-w-[160px] ipadmini:max-w-[220px] relative">
                    {/* Waitlist Card with reduced white glow */}
                    <div className="px-3 py-2">
                      <div
                        className="bg-background/40 backdrop-blur-sm border border-border/20 rounded-xl p-6 shadow-md relative w-full mb-4"
                        style={{ boxShadow: "0 0 12px 2px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.10)" }}>
                        {/* White gradient border for extra glow */}
                        <div
                          className="pointer-events-none absolute inset-0 rounded-xl z-10"
                          style={{ boxShadow: "0 0 16px 4px rgba(255,255,255,0.12)" }}
                        />
                        <div className="flex items-center justify-between mb-2 relative z-20">
                          <h3 className="text-md font-semibold text-foreground">Join the waitlist !</h3>
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        {typeof formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0) !==
                          "undefined" &&
                          formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0) && (
                            <div className="text-xs text-muted-foreground bg-muted/10 rounded px-2 py-1 border border-border/20 mb-2 relative z-20">
                              {formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0)} creators
                              joined
                            </div>
                          )}
                        <form onSubmit={handleSubmit} className="space-y-3 relative z-20">
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-9 text-xs bg-background/60 border-white/20 text-foreground placeholder-muted-foreground focus:border-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
                            required
                          />
                          <Button
                            type="submit"
                            disabled={loading || success || !email}
                            className="w-full h-9 text-xs bg-white/90 text-black hover:bg-white disabled:bg-white/50">
                            {loading ? "Joining..." : success ? "✓ You're in!" : "Join Waitlist"}
                          </Button>
                        </form>
                        {success && (
                          <motion.div
                            className="text-xs text-white bg-white/20 rounded px-2 py-1 border border-white/30 mt-2 relative z-20"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}>
                            🎉 We'll notify you when it's ready!
                          </motion.div>
                        )}
                        <p className="text-xs leading-relaxed mt-3 text-white/20 relative z-20">
                          Get notified when Kimu launches. No spam, just updates on the future of video editing.
                        </p>
                      </div>
                    </div>

                    {/* Copilot Chat Card: pin input to bottom, messages scroll above */}
                    <div className="bg-background/25 backdrop-blur-sm border border-border/20 rounded-xl p-1 shadow-md flex flex-col flex-1 w-full opacity-25 relative overflow-hidden">
                      <div className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" /> Kimu Copilot
                      </div>
                      <div
                        className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2"
                        style={{ minHeight: 0, maxHeight: "calc(100% - 56px)" }}>
                        {sampleChat.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded border border-border/20 text-xs flex items-start gap-2 bg-transparent`}>
                              {!msg.isUser && <Bot className="h-3 w-3 text-muted-foreground mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className="leading-relaxed break-words">{msg.content}</p>
                              </div>
                              {msg.isUser && <User className="h-3 w-3 text-muted-foreground mt-0.5" />}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Chat input box pinned to bottom, always visible */}
                      <form
                        className="flex items-center gap-2 pt-2 border-t border-border/20 bg-background/80 absolute left-0 right-0 bottom-0 p-3"
                        style={{ zIndex: 2 }}>
                        <textarea
                          placeholder="Ask Kimu..."
                          className="flex-1 rounded-lg border border-border/60 bg-background px-3 pt-2.5 pb-1 text-xs placeholder:text-muted-foreground/90 focus:outline-none transition-all duration-200 shadow-sm resize-none min-h-8 max-h-20 leading-relaxed"
                          rows={1}
                          disabled
                          style={{ height: "36px" }}
                        />
                        <Button
                          size="icon"
                          className="h-8 w-8 p-0 bg-transparent hover:bg-primary/10 text-lime-400"
                          variant="ghost"
                          disabled>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M3.5 10L16.5 10M16.5 10L12 5.5M16.5 10L12 14.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8 p-0 bg-transparent hover:bg-primary/10 text-lime-400"
                          variant="ghost"
                          disabled>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M5 8L10 13L15 8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Sections — Bento grid using GlowingEffect */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Built for flow</p>
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  Everything you need to cut faster
                </h3>
              </div>
            </div>

            <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
              {[
                {
                  area: "md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]",
                  icon: <Monitor className="h-4 w-4 text-black dark:text-neutral-400" />,
                  title: "Web‑based, zero‑install",
                  description: "Runs in your browser with instant preview — no downloads, no setup.",
                },
                {
                  area: "md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]",
                  icon: <Github className="h-4 w-4 text-black dark:text-neutral-400" />,
                  title: "OSS — open and community‑built",
                  description:
                    "Completely open‑source. Built with and for the community. Fork, extend, and make it yours.",
                },
                {
                  area: "md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]",
                  icon: <Sparkles className="h-4 w-4 text-black dark:text-neutral-400" />,
                  title: "AI Copilot built‑in",
                  description: "Cut silence, add fades, place assets, generate titles — all with prompts.",
                },
                {
                  area: "md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]",
                  icon: <Cloud className="h-4 w-4 text-black dark:text-neutral-400" />,
                  title: "Everything, On the Cloud",
                  description:
                    "All your assets, timelines and projects are stored securely in the cloud — access them anywhere, any device.",
                },
                {
                  area: "md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]",
                  icon: <Shield className="h-4 w-4 text-black dark:text-neutral-400" />,
                  title: "Security built‑in",
                  description:
                    "Private by design: Strong auth, scoped access, and server‑enforced ownership for every asset and project.",
                },
              ].map((item, i) => (
                <li key={item.title} className={`min-h-[12rem] md:min-h-[14rem] list-none ${item.area}`}>
                  <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={2}
                      hoverBorderWidth={4}
                    />
                    <div className="relative flex h-full flex-col justify-between gap-4 md:gap-6 overflow-hidden rounded-xl p-4 md:p-6 border border-border/20 bg-background/60">
                      <div className="relative flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border border-border/40 p-2">{item.icon}</div>
                        <div className="space-y-2 md:space-y-3">
                          <h4 className="font-sans text-lg md:text-2xl font-semibold text-foreground">{item.title}</h4>
                          <p className="text-xs md:text-base text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plugin ecosystem (coming soon) with pill and custom items */}
        <section className="py-16 border-y border-border/10 bg-background/60">
          <div className="max-w-7xl mx-auto px-6 relative grid md:grid-cols-2 gap-10 items-stretch">
            {/* Left: cleaner mock plugin window */}
            <div className="rounded-2xl border border-border/20 bg-background p-0 overflow-hidden relative">
              <div className="h-10 border-b border-border/20 flex items-center px-4 gap-3">
                <div className="text-xs text-muted-foreground">Kimu • Plugins</div>
              </div>
              {/* content */}
              <div className="grid sm:grid-cols-2">
                {/* list */}
                <div className="border-r border-border/20 p-4 space-y-2">
                  {[
                    { icon: <Sparkles className="w-3.5 h-3.5" />, name: "LUTs & FX", sub: "Color + glow", on: true },
                    {
                      icon: <Bot className="w-3.5 h-3.5" />,
                      name: "Auto‑edit",
                      sub: "Silence + transcript",
                      on: false,
                    },
                    {
                      icon: <Download className="w-3.5 h-3.5" />,
                      name: "Pipelines",
                      sub: "Export + publish",
                      on: true,
                    },
                    { icon: <Type className="w-3.5 h-3.5" />, name: "Motion Titles", sub: "Presets", on: false },
                  ].map((p, i) => (
                    <div
                      key={p.name}
                      className="rounded-lg border border-border/20 hover:border-border/40 transition p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 grid place-items-center rounded-md bg-muted/30 border border-border/20 text-muted-foreground">
                          {p.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">{p.sub}</div>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-9 rounded-full border border-border/30 ${p.on ? "bg-foreground" : "bg-background"}`}>
                        <div
                          className={`h-4 w-4 mt-0.5 rounded-full bg-background transition ${p.on ? "ml-4" : "ml-1"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* preview */}
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preview</div>
                  {/* 3D stacked preview */}
                  <div className="rounded-lg border border-border/20 h-40 bg-muted/10 relative overflow-hidden [perspective:900px]">
                    <div className="absolute inset-0 grid place-items-center [transform-style:preserve-3d]">
                      {/* back glow */}
                      <div className="absolute w-60 h-60 rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-emerald-500/10 blur-2xl" />
                      {/* stack */}
                      <div className="relative w-56 h-24">
                        <div className="absolute inset-0 rounded-xl border border-border/30 bg-background shadow-xl [transform:rotateX(16deg)_rotateY(-8deg)_translateZ(-40px)]" />
                        <div className="absolute inset-0 rounded-xl border border-border/40 bg-background shadow-xl [transform:rotateX(16deg)_rotateY(-8deg)_translateZ(-20px)]" />
                        <div className="absolute inset-0 rounded-xl border border-border/60 bg-background/90 shadow-2xl [transform:rotateX(16deg)_rotateY(-8deg)_translateZ(0)]" />
                        {/* nodes on top card */}
                        <div className="absolute inset-0 p-3 flex items-center gap-3">
                          <div className="h-2 w-16 bg-border/50 rounded" />
                          <div className="h-6 w-6 rounded-md border border-border/40 bg-background" />
                          <div className="flex-1 h-2 bg-border/50 rounded" />
                          <div className="h-8 w-8 rounded-md border border-border/40 bg-background" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">
                    Plugins can add nodes, effects, and exporters into your pipeline.
                  </div>
                </div>
              </div>
              {/* (Removed) Overlap preview across columns */}
            </div>

            {/* Right: copy */}
            <div className="">
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                Coming soon
              </span>
              <div className="flex items-center gap-3 mb-2 mt-3">
                <h3 className="text-2xl font-bold text-foreground">Plugin ecosystem</h3>
              </div>
              <p className="text-muted-foreground mb-6 max-w-prose">
                Extend Kimu without forking the editor. Install community plugins or build your own for effects,
                automations, and export pipelines — powered by a simple, sandboxed API.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    t: "Effects & generators",
                    d: "Transitions, LUTs, titles, overlays, audio FX.",
                  },
                  {
                    t: "Automations",
                    d: "Silence removal, transcript edits, batch cut, templates.",
                  },
                  {
                    t: "Pipelines",
                    d: "Export hooks, captions, upload/publish flows.",
                  },
                ].map((c, i) => (
                  <div key={c.t} className="rounded-xl border border-border/20 p-4 bg-muted/10">
                    <h4 className="text-sm font-semibold text-foreground mb-1">{c.t}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{c.d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-sm text-muted-foreground">
                Want early access to the API?{" "}
                <a href="mailto:robinroy.work@gmail.com" className="underline">
                  Get in touch
                </a>
                .
              </div>
            </div>
          </div>
        </section>

        {/* Multiplayer editing (coming soon) section */}
        <section className="py-16 border-b border-border/10">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
            {/* Left: copy */}
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                Coming soon
              </span>
              <h3 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">Realtime multiplayer editing</h3>
              <p className="mt-3 text-muted-foreground max-w-prose">
                Invite teammates and edit together in realtime. See cursors, selections and changes instantly — perfect
                for teams, reviews and pair-editing.
              </p>
            </div>

            {/* Right: Multiplayer 3D Scene with pointer-follow */}
            <FollowerPointerCard
              title="you"
              className="rounded-2xl border border-border/20 bg-background/90 p-6 relative overflow-hidden shadow-2xl">
              <style>{`
        @keyframes playhead { 0%{ left:8%; } 50%{ left:92%; } 100%{ left:8%; } }
        @keyframes pulse { 0%,100%{ opacity:.5 } 50%{ opacity:1 } }
        @keyframes float { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-6px);} }
        @keyframes glow { 0%,100%{ filter:drop-shadow(0 0 4px currentColor);} 50%{ filter:drop-shadow(0 0 10px currentColor);} }
      `}</style>

              {/* Teal ambient glow */}
              <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.25),rgba(16,185,129,0)_70%)] blur-3xl" />

              <div className="relative h-72 [transform:perspective(1200px)_rotateX(12deg)_rotateY(-6deg)]">
                {/* Toolbar */}
                <div className="h-10 flex items-center justify-between px-4 rounded-md border border-border/30 bg-black/40 shadow-sm mb-4">
                  <div className="text-[11px] text-muted-foreground">🎬 Teaser.mp4 • Project Kimu</div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" />
                    <span className="text-muted-foreground">synced</span>
                  </div>
                </div>

                {/* Timeline layers with depth */}
                <div className="relative space-y-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="relative h-12 rounded-md border border-border/40 bg-black/40 shadow-lg overflow-hidden"
                      style={{ transform: `translateZ(-${i * 30}px)` }}>
                      {/* clips */}
                      {i === 0 && (
                        <div className="absolute left-[12%] top-1/2 -translate-y-1/2 h-7 w-[38%] rounded bg-gradient-to-r from-blue-500/20 to-blue-400/10 border border-blue-400/60 shadow-sm" />
                      )}
                      {i === 1 && (
                        <div className="absolute left-[30%] top-1/2 -translate-y-1/2 h-7 w-[22%] rounded bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 border border-emerald-400/60 shadow-sm" />
                      )}
                      {i === 2 && (
                        <div className="absolute left-[55%] top-1/2 -translate-y-1/2 h-7 w-[28%] rounded bg-gradient-to-r from-purple-500/20 to-purple-400/10 border border-purple-400/60 shadow-sm" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Playhead across layers */}
                <div className="absolute top-10 bottom-2 w-[2px] bg-emerald-400/80 animate-[playhead_9s_linear_infinite]" />

                {/* Multiplayer cursors */}
                <div className="absolute left-[20%] top-16 flex items-center gap-1 animate-[float_4s_ease-in-out_infinite]">
                  <div className="w-3 h-3 rotate-45 bg-blue-400 animate-[glow_2s_infinite]" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/40">
                    sreecha
                  </span>
                </div>
                <div className="absolute left-[58%] top-28 flex items-center gap-1 animate-[float_5s_ease-in-out_infinite]">
                  <div className="w-3 h-3 rotate-45 bg-emerald-400 animate-[glow_2.5s_infinite]" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    robin
                  </span>
                </div>
                <div className="absolute left-[75%] top-40 flex items-center gap-1 animate-[float_6s_ease-in-out_infinite]">
                  <div className="w-3 h-3 rotate-45 bg-purple-400 animate-[glow_3s_infinite]" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/40">
                    lee
                  </span>
                </div>
              </div>
            </FollowerPointerCard>
          </div>
        </section>

        {/* And much more */}
        <section className="py-16">
          <style>{`
            @keyframes tickerX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          `}</style>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-6">
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground">
                And much more
              </span>
              <h3 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
                Little things that add up to flow
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A fast editor is about details. Here are a few we obsess over.
              </p>
            </div>

            {/* Feature ticker */}
            <div className="relative overflow-hidden rounded-xl border border-border/20 bg-background/60">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-transparent to-background [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]" />
              <ul className="flex gap-3 py-3 whitespace-nowrap animate-[tickerX_28s_linear_infinite]">
                {[
                  { i: "⚡", t: "Zero‑lag scrubbing" },
                  { i: "⌘", t: "Pro shortcuts" },
                  { i: "🏷️", t: "Templates" },
                  { i: "🗂️", t: "Bins & tags" },
                  { i: "💬", t: "Inline comments" },
                  { i: "🧪", t: "Version history" },
                  { i: "🎚️", t: "Audio ducking" },
                  { i: "🎛️", t: "LUTs & FX" },
                  { i: "🤖", t: "Smart captions" },
                  { i: "🔌", t: "Plugin API" },
                ]
                  .concat([
                    { i: "⚡", t: "Zero‑lag scrubbing" },
                    { i: "⌘", t: "Pro shortcuts" },
                    { i: "🏷️", t: "Templates" },
                    { i: "🗂️", t: "Bins & tags" },
                    { i: "💬", t: "Inline comments" },
                    { i: "🧪", t: "Version history" },
                    { i: "🎚️", t: "Audio ducking" },
                    { i: "🎛️", t: "LUTs & FX" },
                    { i: "🤖", t: "Smart captions" },
                    { i: "🔌", t: "Plugin API" },
                  ])
                  .map((chip, idx) => (
                    <li
                      // eslint-disable-next-line react/no-array-index-key
                      key={`${chip.i}-${chip.t}-${idx}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-muted/10 text-xs text-foreground/90">
                      <span>{chip.i}</span>
                      <span>{chip.t}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Teaser cards */}
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              {[
                {
                  h: "Comments & reviews",
                  d: "Drop pins on the timeline, mention teammates and resolve threads.",
                },
                {
                  h: "Share links, not files",
                  d: "View‑only links with watermarking and expiring access.",
                },
                {
                  h: "One‑click exports",
                  d: "Presets for socials, captions baked‑in, pipelines for publish.",
                },
              ].map((c, i) => (
                <div key={c.h} className="rounded-xl border border-border/20 p-4 bg-background/60">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{c.h}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA (clean, no container gradients) */}
        <section className="py-14 text-center">
          <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ready to get started?</h3>
          <p className="mt-3 text-muted-foreground">
            Edit less. Create more. A fast, friendly editor that keeps up with you.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/login">
              <Button className="bg-foreground text-background hover:bg-foreground/90">Start editing</Button>
            </Link>
            <a
              href="https://github.com/trykimu/videoeditor"
              target="_blank"
              rel="noreferrer"
              className="text-sm underline text-muted-foreground hover:text-foreground">
              View on GitHub
            </a>
          </div>
        </section>
      </div>

      {/* Footers are now injected globally from root via MarketingFooter */}
    </div>
  );
}

// Add prop types for MobileTimelinePlayground
interface MobileTimelinePlaygroundProps {
  timelineAssets: Array<{
    label: string;
    color: string;
    icon: React.ReactNode;
    heading: React.ReactNode;
    desc: string;
    subtext: string;
    subtext2: string;
    badges: string[];
    start: number;
    duration: number;
    animation: {
      initial: TargetAndTransition;
      animate: TargetAndTransition;
      exit?: TargetAndTransition;
    };
  }>;
  handleLogoClick: () => void;
  logoSpinning: boolean;
}

function MobileTimelinePlayground({ timelineAssets, handleLogoClick, logoSpinning }: MobileTimelinePlaygroundProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);
  // Simulate export progress
  React.useEffect(() => {
    if (exporting) {
      const t = setTimeout(() => setExporting(false), 1200);
      return () => clearTimeout(t);
    }
  }, [exporting]);

  return (
    <div className="w-full flex flex-col items-start px-4 pt-8 gap-8">
      {/* Sleek Timeline Bar */}
      <div className="relative w-full mb-4">
        <div className="absolute left-0 right-0 top-1/2 h-2 bg-muted/40 rounded-full -translate-y-1/2 z-0" />
        <div className="flex gap-4 overflow-x-auto pb-2 w-full snap-x snap-mandatory relative z-10">
          {timelineAssets.map((asset: MobileTimelinePlaygroundProps["timelineAssets"][number], i: number) => (
            <button
              key={asset.label}
              onClick={() => setActiveIdx(i)}
              className={`min-w-[90px] max-w-[120px] px-3 py-3 rounded-xl border border-border/30 bg-background/95 flex flex-col items-center gap-2 snap-center shadow-lg transition-all duration-200 ${activeIdx === i ? "ring-2 ring-blue-400 scale-105" : "hover:scale-105"
                } ${activeIdx === i ? "z-20" : "z-10"}`}
              style={{ opacity: activeIdx === i ? 1 : 0.7 }}>
              <span className="text-2xl mb-1">{asset.icon}</span>
              <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{asset.label}</span>
            </button>
          ))}
        </div>
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 left-0 flex items-center pointer-events-none"
          style={{
            left: `calc(${(activeIdx / (timelineAssets.length - 1)) * 100}% - 8px)`,
          }}>
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg border-2 border-background" />
        </div>
      </div>
      {/* Editor Canvas - Modern Card */}
      <div className="w-full bg-gradient-to-br from-background/95 to-muted/60 border border-border/20 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative min-h-[200px]">
        {/* Mascot and Playful Animation */}
        <div className="flex items-center gap-3 mb-2">
          <div onClick={handleLogoClick} className="cursor-pointer select-none" style={{ display: "inline-block" }}>
            <KimuLogo className={`w-10 h-10 text-foreground ${logoSpinning ? "animate-spin" : ""}`} />
          </div>
          <span className="text-lg font-bold text-foreground">Kimu Editor</span>
        </div>
        {/* Animated Feature Preview */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
            {timelineAssets[activeIdx].heading}
          </span>
          <span className="text-base text-muted-foreground mb-1">{timelineAssets[activeIdx].desc}</span>
          <span className="text-sm text-muted-foreground mb-1">{timelineAssets[activeIdx].subtext}</span>
          <span className="text-xs text-muted-foreground mb-2">{timelineAssets[activeIdx].subtext2}</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {timelineAssets[activeIdx].badges.map((badge: string, j: number) => (
              <span
                key={badge}
                className="px-2 py-1 rounded bg-muted/30 text-xs text-foreground border border-border/20 font-medium shadow-sm">
                {badge}
              </span>
            ))}
          </div>
        </div>
        {/* Playful micro-animation: e.g., a fake playhead, a sparkle, a cut, etc. */}
        <div className="absolute right-6 bottom-6 flex items-center gap-2">
          {activeIdx === 0 && <Video className="w-7 h-7 text-blue-400 animate-pulse" />}
          {activeIdx === 1 && <Sparkles className="w-7 h-7 text-yellow-400 animate-bounce" />}
          {activeIdx === 2 && <Zap className="w-7 h-7 text-blue-400 animate-pulse" />}
          {activeIdx === 3 && <Wand2 className="w-7 h-7 text-purple-400 animate-spin-slow" />}
          {activeIdx === 4 && <Heart className="w-7 h-7 text-pink-400 animate-pulse" />}
          {activeIdx === 5 && <Scissors className="w-7 h-7 text-foreground animate-bounce" />}
        </div>
      </div>
      {/* Waitlist as Export Project - Sleek Modern */}
      <div className="w-full max-w-xs bg-gradient-to-br from-background/95 to-muted/60 border border-border/20 rounded-2xl shadow-2xl p-6 flex flex-col items-start gap-3 mb-4 mt-6">
        <span className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" /> Export Project
        </span>
        <form
          className="w-full flex flex-row items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setExporting(true);
          }}>
          <div className="flex-1 flex items-center bg-background/80 border border-border/30 rounded-lg px-2 py-1 shadow-inner">
            <Video className="w-4 h-4 text-blue-400 mr-2" />
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/70"
              required
              disabled={exporting}
            />
          </div>
          <Button
            type="submit"
            className="h-9 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition-all"
            disabled={exporting}>
            <Download className="w-4 h-4" />
          </Button>
        </form>
        <div className="w-full h-2 bg-muted/30 rounded mt-2 overflow-hidden">
          <div className={`h-2 bg-blue-500 rounded transition-all duration-700 ${exporting ? "w-full" : "w-0"}`} />
        </div>
        <p className="text-xs text-muted-foreground text-left mt-1">
          Get notified when Kimu launches. No spam, just creative updates.
        </p>
      </div>
    </div>
  );
}

// New mobile-only view: Video Editor Preview Playground
interface MobileVideoEditorProps {
  timelineAssets: Array<{
    label: string;
    color: string;
    icon: React.ReactNode;
    heading: React.ReactNode;
    desc: string;
    subtext: string;
    subtext2: string;
    badges: string[];
    start: number;
    duration: number;
    animation: {
      initial: TargetAndTransition;
      animate: TargetAndTransition;
      exit?: TargetAndTransition;
    };
  }>;
  handleLogoClick: () => void;
  logoSpinning: boolean;
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  success: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  waitlistCount: number;
}

function MobileVideoEditorPreview({
  timelineAssets,
  handleLogoClick,
  logoSpinning,
  email,
  setEmail,
  loading,
  success,
  handleSubmit,
  waitlistCount,
}: MobileVideoEditorProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true); // Auto-play by default
  const [currentTime, setCurrentTime] = React.useState(0);

  // Auto-play through sections with looping - Much faster
  React.useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 1.5; // Increased speed from 0.5 to 1.5
        const totalDuration = timelineAssets.reduce((sum, asset) => sum + asset.duration, 0);
        if (newTime >= totalDuration) return 0; // Loop back to start
        return newTime;
      });
    }, 200); // Reduced interval from 500ms to 200ms for much faster playback
    return () => clearInterval(interval);
  }, [playing, timelineAssets]);

  // Calculate which section is active based on current time
  React.useEffect(() => {
    let accumulatedTime = 0;
    for (let i = 0; i < timelineAssets.length; i++) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + timelineAssets[i].duration) {
        setActiveIdx(i);
        break;
      }
      accumulatedTime += timelineAssets[i].duration;
    }
  }, [currentTime, timelineAssets]);

  const totalDuration = timelineAssets.reduce((sum, asset) => sum + asset.duration, 0);
  const progress = (currentTime / totalDuration) * 100;

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <div className="">
        {/* Desktop-style Waitlist Card for Mobile */}

        {/* Video Editor App Window */}
        <div className="px-4 py-6">
          <div className="relative max-w-sm mx-auto">
            {/* removed mobile bg gradient per request */}
            <div className="bg-background/95 border border-border/20 rounded-xl shadow-xl overflow-hidden">
              {/* App Header - Thinner */}
              <div className="h-8 bg-muted/10 border-b border-border/20 flex items-center px-4">
                <div className="flex items-center gap-2">
                  <KimuLogo className="w-4 h-4 text-foreground" />
                  <span className="text-xs font-semibold text-foreground">Kimu Studio</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>File</span>
                  <span>Edit</span>
                  <span>View</span>
                </div>
              </div>

              {/* Preview Window - Vertically Bigger */}
              <div className="w-full h-64 bg-black/90 relative flex items-center justify-center">
                {/* Preview Content */}
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center">
                    <div className="text-4xl mb-4">{timelineAssets[activeIdx].icon}</div>
                    <h2 className="text-xl font-bold text-white mb-3">{timelineAssets[activeIdx].heading}</h2>
                    <p className="text-base text-zinc-300 max-w-xs">{timelineAssets[activeIdx].desc}</p>
                  </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-1 bg-white rounded-full"
                      style={{ width: `${progress}%` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Controls */}
              <div className="h-10 bg-muted/10 border-b border-border/20 flex items-center px-4 gap-3">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPlaying(!playing)}>
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">Track {activeIdx + 1}</span>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>

              {/* Professional Timeline - Adobe After Effects Style */}
              <div className="bg-muted/5">
                {/* Timeline Header */}
                <div className="h-8 bg-muted/20 border-b border-border/20 flex items-center px-4">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">Timeline</span>
                    <span>•</span>
                    <span>
                      {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, "0")}
                    </span>
                    <span>•</span>
                    <span>
                      {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>

                {/* Timeline Content */}
                <div className="p-4">
                  {/* Time Ruler */}
                  <div className="h-6 bg-muted/30 border-b border-border/20 flex items-center px-4 mb-2 relative">
                    <div className="flex justify-between w-full text-xs text-muted-foreground font-mono">
                      <span>0:00</span>
                      <span>0:30</span>
                      <span>1:00</span>
                      <span>1:30</span>
                      <span>2:00</span>
                      <span>2:30</span>
                    </div>

                    {/* Global Playhead */}
                    <motion.div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${progress}%` }}
                      animate={{ left: `${progress}%` }}
                      transition={{ duration: 0.1 }}>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rotate-45" />
                    </motion.div>
                  </div>

                  {/* Tracks Container */}
                  <div className="space-y-1">
                    {timelineAssets.map((asset: MobileVideoEditorProps["timelineAssets"][number], i: number) => {
                      const trackStart = timelineAssets.slice(0, i).reduce((sum, a) => sum + a.duration, 0);
                      const trackProgress = Math.max(0, Math.min(1, (currentTime - trackStart) / asset.duration));
                      const isActive = i === activeIdx;
                      const isPast = currentTime > trackStart + asset.duration;
                      const isFuture = currentTime < trackStart;

                      // Calculate track width based on duration
                      const trackWidth = `${(asset.duration / totalDuration) * 100}%`;
                      const trackOffset = `${(trackStart / totalDuration) * 100}%`;

                      return (
                        <div key={asset.label} className="flex items-center h-8">
                          {/* Track Label */}
                          <div
                            className={`w-20 h-full ${isActive ? "bg-blue-500/20" : "bg-muted/20"
                              } border-r border-border/20 flex items-center px-2`}>
                            <span
                              className={`text-xs font-medium ${isActive ? "text-blue-400" : "text-foreground"
                                } truncate`}>
                              Track {i + 1}
                            </span>
                          </div>

                          {/* Track Timeline */}
                          <div className="flex-1 h-full bg-muted/10 border-b border-border/20 relative">
                            {/* Track Background */}
                            <div
                              className={`absolute top-0 bottom-0 ${asset.color} opacity-10 rounded-sm`}
                              style={{
                                left: trackOffset,
                                width: trackWidth,
                                minWidth: "80px",
                              }}
                            />

                            {/* Track Content */}
                            <div
                              className={`absolute top-0 bottom-0 flex items-center px-2 rounded-sm border ${isActive ? "border-blue-400/50" : "border-border/30"
                                }`}
                              style={{
                                left: trackOffset,
                                width: trackWidth,
                                minWidth: "80px",
                              }}>
                              <span
                                className={`text-xs font-medium ${isActive ? "text-blue-400" : "text-foreground"
                                  } truncate`}>
                                {asset.label}
                              </span>
                            </div>

                            {/* Progress Fill */}
                            {!isFuture && (
                              <motion.div
                                className={`absolute top-0 bottom-0 ${isActive ? "bg-blue-500" : asset.color
                                  } opacity-40 rounded-sm`}
                                style={{
                                  left: trackOffset,
                                  width: `${Math.min(trackProgress * 100, 100)}%`,
                                  maxWidth: trackWidth,
                                }}
                                animate={{
                                  width: `${Math.min(trackProgress * 100, 100)}%`,
                                }}
                                transition={{ duration: 0.1 }}
                              />
                            )}

                            {/* Track Status Indicators */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              {isPast && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                              {isActive && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full px-4 py-8">
          <div className="max-w-sm mx-auto">
            <div className="bg-background/80 border border-border/20 rounded-xl shadow-lg p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Join the waitlist</h3>
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              {typeof formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0) !== "undefined" &&
                formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0) && (
                  <div className="text-xs text-muted-foreground bg-muted/10 rounded px-2 py-1 border border-border/20 mb-2">
                    {formatCreatorCount(typeof waitlistCount !== "undefined" ? waitlistCount : 0)} creators joined
                  </div>
                )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs bg-background/60 border-white/20 text-foreground placeholder-muted-foreground focus:border-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading || success || !email}
                  className="w-full h-9 text-xs bg-white/90 text-black hover:bg-white disabled:bg-white/50">
                  {loading ? "Joining..." : success ? "✓ You're in!" : "Join Waitlist"}
                </Button>
              </form>
              {success && (
                <motion.div
                  className="text-xs text-white bg-white/20 rounded px-2 py-1 border border-white/30 mt-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}>
                  🎉 We'll notify you when it's ready!
                </motion.div>
              )}
              <p className="text-xs leading-relaxed mt-3 text-white/20">
                Get notified when Kimu launches. No spam, just updates on the future of video editing.
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile outer outline */}
      {/* <svg className="pointer-events-none absolute -inset-[8px] w-[calc(100%+16px)] h-[calc(100%+16px)]" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <rect x="12" y="12" width="976" height="976" rx="24" ry="24" fill="none" stroke="#60a5fa" strokeOpacity="0.18" strokeWidth="5" className="[stroke-dasharray:180_4200] animate-[kimu-dash-slow_20s_linear_infinite]" />
        <rect x="12" y="12" width="976" height="976" rx="24" ry="24" fill="none" stroke="#9ae6ff" strokeWidth="2" className="[stroke-dasharray:80_4300] animate-[kimu-dash-slow_20s_linear_infinite]" />
      </svg> */}
    </div>
  );
}