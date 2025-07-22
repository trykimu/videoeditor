import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
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
  Settings,
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
  Clock,
  Users,
  ArrowRight,
  Github,
  Twitter,
  ExternalLink,
  Monitor,
  Edit,
  Zap,
  Heart,
  Globe,
  Shield,
  Mail,
  ArrowDown,
  PlayCircle,
  ChevronRight,
  ChevronDown,
  Bot,
  User,
  Send,
  ChevronLeft,
} from "lucide-react";
import { AnimatePresence, motion as m } from "framer-motion";

// Vite env type for TS
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

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
    const res = await fetch("https://<SUPABASE_URL>.supabase.co/rest/v1/waitlist?select=count", {
      method: "HEAD",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "count=exact"
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
  const [showNavbarLogo, setShowNavbarLogo] = useState(false);
  const [gitHubStars, setGitHubStars] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        const rect = heroSection.getBoundingClientRect();
        // Show navbar logo when hero section is mostly out of view
        setShowNavbarLogo(rect.bottom < 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      setCountLoading(true);
      const count = await getWaitlistCount();
      setWaitlistCount(count);
      setCountLoading(false);
    };
    
    const fetchGitHubStars = async () => {
      try {
        const res = await fetch("https://api.github.com/repos/robinroy03/videoeditor");
        const data = await res.json();
        setGitHubStars(data.stargazers_count || 0);
      } catch (error) {
        console.log('Failed to fetch GitHub stars');
      }
    };
    
    fetchCount();
    fetchGitHubStars();
  }, []);

  // Calculate totalDuration as the end of the last asset
  const timelineAssets = [
    {
      label: 'Intro',
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      icon: <Video className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-white">Think "vibe coding,"</span><br />
          <span className="text-white/80">but for video editing</span>
        </>
      ),
      desc: 'A new way to edit. Effortless, playful, and powerful.',
      subtext: 'Creators save time while Kimu handles the heavy lifting.',
      subtext2: 'For creators who’d rather be creating. If editing drains you — Kimu gives your time back.',
      badges: ["AI-Powered", "Zero Latency", "Creator DNA"],
      start: 0,
      duration: 30,
      animation: { initial: { opacity: 0, scale: 0.8, y: 40 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.8, y: -40 } },
    },
    {
      label: 'Built for Creators',
      color: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      icon: <Sparkles className="w-3 h-3 text-yellow-400 mr-1" />, // yellow
      heading: (
        <>
          <span className="text-yellow-400">Built for creators,</span><br />
          <span className="text-white">by creators</span>
        </>
      ),
      desc: 'Every feature designed to get out of your way and let creativity flow.',
      subtext: 'We obsess over details so you can focus on your story.',
      subtext2: 'A tool that feels like an extension of your imagination.',
      badges: ["Creator-first", "Intuitive", "Community-driven"],
      start: 30,
      duration: 30,
      animation: { initial: { opacity: 0, x: -80, scale: 0.7 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 80, scale: 0.7 } },
    },
    {
      label: 'Zero Latency',
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      icon: <Zap className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-blue-400">Zero Latency</span>
        </>
      ),
      desc: 'Real-time editing with instant preview. Every cut happens immediately.',
      subtext: 'No more waiting. See your changes as you make them.',
      subtext2: 'Edit at the speed of thought.',
      badges: ["Instant Preview", "No Waiting", "Realtime"],
      start: 60,
      duration: 30,
      animation: { initial: { opacity: 0, scale: 0.5, rotate: -10 }, animate: { opacity: 1, scale: 1, rotate: 0 }, exit: { opacity: 0, scale: 0.5, rotate: 10 } },
    },
    {
      label: 'AI Assistant',
      color: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
      icon: <Wand2 className="w-3 h-3 text-purple-400 mr-1" />, // purple
      heading: (
        <>
          <span className="text-purple-400">AI Assistant</span>
        </>
      ),
      desc: 'Smart suggestions that learn your style and automate repetitive tasks.',
      subtext: 'Kimu Copilot helps you edit faster with smart, context-aware suggestions.',
      subtext2: 'Automate the boring, focus on the magic.',
      badges: ["AI Copilot", "Smart Suggestions", "Automation"],
      start: 90,
      duration: 30,
      animation: { initial: { opacity: 0, y: 60, scale: 0.7 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -60, scale: 0.7 } },
    },
    {
      label: 'Creator DNA',
      color: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
      icon: <Heart className="w-3 h-3 text-pink-400 mr-1" />, // pink
      heading: (
        <>
          <span className="text-pink-400">Creator DNA</span>
        </>
      ),
      desc: 'Intuitive interface that feels like an extension of your creativity.',
      subtext: 'Personalized, playful, and powerful.',
      subtext2: 'Designed for creators, by creators.',
      badges: ["Personalized", "Intuitive UI", "Playful"],
      start: 120,
      duration: 34,
      animation: { initial: { opacity: 0, scale: 0.6, x: 60 }, animate: { opacity: 1, scale: 1, x: 0 }, exit: { opacity: 0, scale: 0.6, x: -60 } },
    },
    {
      label: 'Vibe Engine',
      color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      icon: <Sparkles className="w-3 h-3 text-blue-400 mr-1" />, // blue
      heading: (
        <>
          <span className="text-blue-400">Vibe Engine</span>
        </>
      ),
      desc: 'Transform raw footage into polished stories with one-click magic.',
      subtext: 'Let Kimu handle the technicals while you focus on the vibe.',
      subtext2: 'One-click story magic for creators.',
      badges: ["Vibe Engine", "One-click Magic", "Story Polishing"],
      start: 154,
      duration: 30,
      animation: { initial: { opacity: 0, scale: 0.7, y: 80 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.7, y: -80 } },
    },
  ];
  // Calculate totalDuration as the end of the last asset
  const totalDuration = timelineAssets.length > 0 ? (timelineAssets[timelineAssets.length - 1].start + timelineAssets[timelineAssets.length - 1].duration) : 0;

  // Use totalDuration for playhead looping
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev >= totalDuration ? 0 : prev + 1));
      }, 120); // slowed down by 20%
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration]);

  // Use totalDuration for progress bar
  const progress = (currentTime / totalDuration) * 100;

  // Use totalDuration for timeline block widths and playhead
  const activeAssetIndex = timelineAssets.findIndex(
    (asset, i) =>
      currentTime >= asset.start &&
      currentTime < asset.start + asset.duration
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
        setWaitlistCount(prev => prev + 1);
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
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.type = 'sine';
        
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
      console.log('Audio not supported');
    }
    
    setTimeout(() => {
      setLogoSpinning(false);
    }, 1000);
  };

  const formattedCreatorCount = formatCreatorCount(waitlistCount);

  // Sample copilot chat messages
  const sampleChat = [
    { id: 1, isUser: false, content: "Hi! I'm Kimu Copilot. How can I help you edit your video today?", timestamp: new Date() },
    { id: 2, isUser: true, content: "Can you trim the first 10 seconds?", timestamp: new Date() },
    { id: 3, isUser: false, content: "Done! The first 10 seconds have been trimmed from your timeline.", timestamp: new Date() },
    { id: 4, isUser: true, content: "Add a fade-in effect to the intro clip.", timestamp: new Date() },
    { id: 5, isUser: false, content: "Fade-in effect added to the intro. Anything else?", timestamp: new Date() },
  ];

  // Features array for the stepper
  const features = [
    {
      title: "Zero Latency",
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
  }, [isPlaying, featureAutoPlay]);

  // In the timeline logic, calculate the current feature section based on playhead
  const timelineSections = features.length;
  const timelineDuration = 154; // seconds (from earlier code)
  const sectionLength = timelineDuration / timelineSections;
  const currentFeatureIndex = Math.floor(currentTime / sectionLength) % features.length;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Navbar with Conditional Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Conditional Logo in Navbar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: showNavbarLogo ? 1 : 0,
                x: showNavbarLogo ? 0 : -20
              }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <motion.div
                onClick={handleLogoClick}
                animate={{ rotate: logoSpinning ? 360 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <KimuLogo className="w-8 h-8 text-foreground" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">Kimu</span>
            </motion.div>
            
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/robinroy03/videoeditor"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 border-2 border-border/50 rounded-lg px-3 py-2 hover:border-foreground/30 hover:bg-muted/10"
              >
                <Github className="w-5 h-5" />
                {gitHubStars > 0 && (
                  <span className="text-xs bg-foreground/10 text-foreground px-2 py-1 rounded-full font-medium border border-border/30">
                    {gitHubStars}
                  </span>
                )}
              </a>
              <a
                href="https://twitter.com/trykimu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/24Mt5DGcbx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Join our Discord"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                  <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                  <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c0.667 -1.667 0.5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-0.972 1.923a11.913 11.913 0 0 0 -4.053 0l-0.975 -1.923c-1.5 0.16 -3.043 0.485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c0.667 1.333 2 3 3.5 3c0.5 0 2 -2 2 -3"></path>
                  <path d="M7 16.5c3.5 1 6.5 1 10 0"></path>
                </svg>
              </a>
              <Link to="/roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Roadmap
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20">
        {/* Logo and Title Section - Left Aligned */}
        <section id="hero-section" className="py-12">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-6"
            >
              <motion.div
                onClick={handleLogoClick}
                animate={{ rotate: logoSpinning ? 360 : 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <KimuLogo className="w-16 h-16 text-foreground" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Kimu</h1>
            </motion.div>
          </div>
        </section>

        {/* Video Editor Interface Section */}
        <section className="py-8 relative">
          <div className="max-w-[85vw] mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-xl overflow-hidden outline outline-2 outline-white/10 relative"
            >
                            {/* Top Menu Bar */}
              <div className="h-12 bg-muted/10 border-b border-border/20 flex items-center px-6 text-sm relative z-10">
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

              {/* Main Editor Layout - Smaller Height */}
              <div className="hidden sm:flex h-[650px] lg:h-[700px]">
                
                {/* Left Sidebar - Media Bin with Much More Translucent Elements */}
                <div className="hidden xl:flex ipadmini:hidden w-56 bg-background/25 backdrop-blur-sm border-r border-border/20 flex-col gap-6 p-4 h-full min-w-0">
                  <div className="h-10 bg-background/60 backdrop-blur-sm border-b border-border/20 flex items-center px-3 text-xs font-medium rounded-xl opacity-25 mb-3">
                    <Folder className="w-4 h-4 mr-2 text-blue-500" />
                    Media Library
                  </div>
                  <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="bg-background/25 backdrop-blur-sm border border-border/20 rounded-xl p-4 shadow-md flex flex-col gap-3 opacity-25">
                      {[{ icon: Video, name: "Vibe_Coding.mp4", duration: "2:34", color: "text-blue-500" }, { icon: Music, name: "Lo_Fi_Beats.mp3", duration: "1:45", color: "text-green-500" }, { icon: Image, name: "Code_Editor.png", duration: "", color: "text-purple-500" }, { icon: Type, name: "Title_Card.txt", duration: "", color: "text-orange-500" }].map((item, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
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
                <div className="flex-1 flex flex-col min-w-0">
                  
                  {/* Preview Window - Better */}
                  <div className="flex-1 bg-black/90 relative flex flex-col items-center justify-center w-full h-full min-h-[300px] min-w-0 ipadmini:min-w-0 ipadmini:w-full">
                    {/* Main Content - Strictly centered, with reserved space for play bar */}
                    <div className="flex-1 flex flex-col justify-center items-center text-center px-2 md:px-6 lg:px-12 pt-8 pb-20 w-full h-full overflow-hidden">
                      <AnimatePresence mode="wait" initial={false}>
                        <m.div
                          key={activeAssetIndex}
                          initial={activeAsset.animation.initial}
                          animate={activeAsset.animation.animate}
                          exit={activeAsset.animation.exit}
                          transition={{ type: 'spring', stiffness: 80, damping: 22, duration: 1.1 }}
                          className="w-full flex flex-col items-center justify-center"
                          style={{ minHeight: 340, paddingTop: 24, paddingBottom: 24 }}
                        >
                          <div className="flex flex-col items-center w-full">
                            <m.div
                              key={activeAssetIndex + '-icon'}
                              initial={{ opacity: 0, scale: 0.7, filter: 'blur(8px)' }}
                              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                              exit={{ opacity: 0, scale: 0.7, filter: 'blur(8px)' }}
                              transition={{ type: 'spring', stiffness: 100, damping: 18, delay: 0.12 }}
                              className="mb-4"
                              style={{ fontSize: 44 }}
                            >
                              {activeAsset.icon}
                            </m.div>
                            <m.h2
                              key={activeAssetIndex + '-title'}
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1.15 }}
                              exit={{ opacity: 0, y: -20, scale: 0.9 }}
                              transition={{ delay: 0.18, duration: 0.7 }}
                              className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white text-center drop-shadow-lg mb-4"
                              style={{ fontFamily: 'Montserrat, Poppins, Arial, sans-serif', letterSpacing: '-0.01em', lineHeight: 1.1 }}
                            >
                              {typeof activeAsset.heading === 'string' ? activeAsset.heading : activeAsset.heading}
                            </m.h2>
                            <m.p
                              key={activeAssetIndex + '-desc'}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: 0.25, duration: 0.7 }}
                              className="text-lg md:text-xl text-zinc-200 text-center max-w-2xl font-semibold mb-6"
                              style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', letterSpacing: '-0.01em' }}
                            >
                              {activeAsset.desc || ''}
                            </m.p>
                          </div>
                          <div className="flex flex-col items-center gap-2 w-full mb-2">
                            <p className="text-base md:text-lg text-zinc-300 text-center max-w-2xl font-medium mb-1" style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
                              {activeAsset.subtext}
                            </p>
                            <p className="text-sm md:text-base text-zinc-400 text-center max-w-xl font-normal" style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
                              {activeAsset.subtext2}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-3 w-full min-h-[48px] mt-6">
                            {activeAsset.badges.map((badge, i) => (
                              <Badge key={i} className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-xs md:text-sm py-2 px-4 animate-pulse">
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </m.div>
                      </AnimatePresence>
                    </div>
                    {/* Play bar and controls at the bottom, always visible and full width, fixed height */}
                    <div className="absolute left-0 right-0 bottom-0 h-16 flex items-end">
                      <div className="w-full bg-black/70 backdrop-blur-md p-2 border-t border-white/10 flex flex-col justify-end">
                        {/* Progress bar (seek bar) */}
                        <div className="w-full h-0.5 mb-2 bg-white/10 rounded-full overflow-hidden flex items-center">
                          <m.div
                            className="h-0.5 bg-white rounded-full transition-all duration-200"
                            style={{ width: `${progress}%` }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                          />
                        </div>
                        {/* Play bar controls */}
                        <div className="flex items-center gap-2 text-white text-sm w-full justify-between">
                          <div className="flex items-center gap-2">
                            <button className="hover:text-white/70 transition-colors p-1">
                              <SkipBack className="w-4 h-4" />
                            </button>
                            <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-white/80 transition-colors p-1">
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
                            {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 2:34
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
                          key={i}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
                          title={tool.label}
                        >
                          <tool.icon className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    
                    <div className="w-px h-6 bg-border/30 mx-2"></div>
                    
                    <div className="flex items-center gap-1">
                      {[
                        { icon: Layers, label: "Layers" },
                        { icon: Sparkles, label: "Effects" },
                        { icon: Type, label: "Text" },
                        { icon: Wand2, label: "AI Tools" },
                      ].map((tool, i) => (
                        <button
                          key={i}
                          className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted/20 transition-colors text-muted-foreground hover:text-foreground"
                          title={tool.label}
                        >
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
                            <div key={i} className="flex-1 border-r border-border/20 px-1 text-muted-foreground">
                              {i * 20}s
                            </div>
                          ))}
                        </div>

                        {/* Single Video Track with multiple assets */}
                        <div className="absolute top-4 left-0 right-0 h-12 border-b border-border/20 p-1 flex items-center" style={{ gap: '8px' }}>
                          {timelineAssets.map((asset, i) => {
                            const width = `${(asset.duration / totalDuration) * 100}%`;
                            return (
                              <m.div
                                key={i}
                                className={`h-full rounded flex items-center px-2 pr-3 opacity-60 hover:opacity-80 transition-opacity cursor-pointer border ${asset.color}`}
                                style={{ width, minWidth: 0 }}
                                initial={{ width: 0 }}
                                animate={{ width }}
                                transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                              >
                                {asset.icon}
                                <span className={`text-xs ${asset.color.split(' ')[2]}`}>{asset.label}</span>
                              </m.div>
                            );
                          })}
                        </div>

                        {/* Playhead */}
                        <m.div
                          className="absolute top-4 bottom-0 w-px bg-red-500 z-10"
                          animate={{ left: `${progress}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                        >
                          <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rotate-45"></div>
                        </m.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Inspector Panel (wider) */}
                <div className="min-w-[220px] max-w-[320px] w-full bg-background/25 backdrop-blur-sm border-l border-border/20 flex flex-col gap-4 p-3 h-full ipadmini:min-w-[160px] ipadmini:max-w-[220px] relative">
                  {/* Waitlist Card with reduced white glow */}
                  <div className="px-3 py-2">
                  <div className="bg-background/40 backdrop-blur-sm border border-border/20 rounded-xl p-6 shadow-md relative w-full mb-4" style={{ boxShadow: '0 0 12px 2px rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.10)' }}>
                    {/* White gradient border for extra glow */}
                    <div className="pointer-events-none absolute inset-0 rounded-xl z-10" style={{boxShadow: '0 0 16px 4px rgba(255,255,255,0.12)'}} />
                    <div className="flex items-center justify-between mb-2 relative z-20">
                      <h3 className="text-md font-semibold text-foreground">Join the waitlist !</h3>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    {formattedCreatorCount && !countLoading && (
                      <div className="text-xs text-muted-foreground bg-white/10 rounded px-2 py-1 border border-white/20 mb-2 relative z-20">
                        {formattedCreatorCount} creators joined
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
                        className="w-full h-9 text-xs bg-white/90 text-black hover:bg-white disabled:bg-white/50"
                      >
                        {loading ? "Joining..." : success ? "✓ You're in!" : "Join Waitlist"}
                      </Button>
                    </form>
                    {success && (
                      <motion.div
                        className="text-xs text-white bg-white/20 rounded px-2 py-1 border border-white/30 mt-2 relative z-20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        🎉 We'll notify you when it's ready!
                      </motion.div>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed mt-3 text-white/20 relative z-20">
                      Get notified when Kimu launches. No spam, just updates on the future of video editing.
                    </p>
                    </div>
                    </div>

                  {/* Copilot Chat Card: pin input to bottom, messages scroll above */}
                  <div className="bg-background/25 backdrop-blur-sm border border-border/20 rounded-xl p-1 shadow-md flex flex-col flex-1 w-full opacity-25 relative overflow-hidden">
                    <div className="font-semibold text-foreground mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-muted-foreground" /> Kimu Copilot</div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-2" style={{ minHeight: 0, maxHeight: 'calc(100% - 56px)' }}>
                      {sampleChat.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded border border-border/20 text-xs flex items-start gap-2 bg-transparent`}>
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
                    <form className="flex items-center gap-2 pt-2 border-t border-border/20 bg-background/80 absolute left-0 right-0 bottom-0 p-3" style={{ zIndex: 2 }}>
                      <textarea
                        placeholder="Ask Kimu..."
                        className="flex-1 rounded-lg border border-border/60 bg-background px-3 pt-2.5 pb-1 text-xs placeholder:text-muted-foreground/90 focus:outline-none transition-all duration-200 shadow-sm resize-none min-h-8 max-h-20 leading-relaxed"
                        rows={1}
                        disabled
                        style={{ height: '36px' }}
                      />
                      <Button size="icon" className="h-8 w-8 p-0 bg-transparent hover:bg-primary/10 text-lime-400" variant="ghost" disabled>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 10L16.5 10M16.5 10L12 5.5M16.5 10L12 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Button>
                      <Button size="icon" className="h-8 w-8 p-0 bg-transparent hover:bg-primary/10 text-lime-400" variant="ghost" disabled>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      {/* Sleek Modern Footer */}
      <footer className="bg-background border-t border-border/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row justify-between gap-12">
            
            {/* Left Side - Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <KimuLogo className="w-8 h-8 text-foreground opacity-90" />
                <span className="text-2xl font-bold text-foreground">Kimu</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                If editing drains you — Kimu gives your time back. Focus on what matters.
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://github.com/robinroy03/videoeditor" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all border border-border/20 hover:border-border/40"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {gitHubStars > 0 && (
                    <span className="text-xs bg-foreground/10 px-1 py-0.5 rounded font-medium">{gitHubStars}</span>
                  )}
                </a>
                <a 
                  href="https://twitter.com/trykimu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a 
                  href="https://discord.gg/24Mt5DGcbx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                  title="Join our Discord"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Center - Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Product</h4>
                <div className="space-y-2">
                  <Link to="/roadmap" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Roadmap
                  </Link>
                  <Link to="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                  <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Changelog
                  </a>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Community</h4>
                <div className="space-y-2">
                  <a href="https://github.com/robinroy03/videoeditor" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    GitHub
                  </a>
                  <a href="https://twitter.com/trykimu" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Twitter
                  </a>
                  <a href="https://discord.gg/24Mt5DGcbx" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Discord
                  </a>
                </div>
              </div>
              
            </div>

            {/* Right Side - CTA */}
            <div className="space-y-4 lg:text-right">
              <h4 className="font-semibold text-foreground">Ready to transform your editing?</h4>
              <Button 
                className="bg-foreground text-background hover:bg-foreground/90 px-6 py-2"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => {
                    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                    emailInput?.focus();
                  }, 800);
                }}
              >
                Join Waitlist
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <p className="text-xs text-muted-foreground lg:max-w-xs">
                Join thousands of creators who are reimagining video editing
              </p>
            </div>
          </div>

        </div>
      </footer>

      {/* Mobile View: Only visible on mobile screens */}
      <div className="block sm:hidden w-full min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-0 relative overflow-x-hidden">
        {/* Kimu Logo */}
        <div className="mt-10 mb-6">
          <KimuLogo className="w-20 h-20 mx-auto" />
        </div>
        {/* Tagline */}
        <h1 className="text-2xl font-extrabold text-center mb-2 tracking-tight leading-tight">
          Kimu
        </h1>
        <p className="text-base text-center mb-8 text-muted-foreground font-semibold">Edit Less. Create More.</p>
        {/* Waitlist Card */}
        <div className="w-full max-w-sm mx-auto mb-10 px-4">
          <div className="bg-background/80 backdrop-blur-lg border border-border/20 rounded-2xl p-6 shadow-xl flex flex-col items-center relative">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl">✨</span>
            <h3 className="text-lg font-bold text-foreground mb-2 mt-4">Join the waitlist!</h3>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base bg-background/60 border-white/20 text-foreground placeholder-muted-foreground focus:border-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0 rounded-lg"
                required
              />
              <Button
                type="submit"
                disabled={loading || success || !email}
                className="w-full h-12 text-base bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50 rounded-lg font-semibold"
              >
                {loading ? "Joining..." : success ? "✓ You're in!" : "Join Waitlist"}
              </Button>
            </form>
            {success && (
              <motion.div
                className="text-sm text-white bg-white/20 rounded px-2 py-1 border border-white/30 mt-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                🎉 We'll notify you when it's ready!
              </motion.div>
            )}
            <p className="text-xs text-muted-foreground leading-relaxed mt-3 text-center">
              Get notified when Kimu launches. No spam, just updates on the future of video editing.
            </p>
          </div>
        </div>
        {/* Horizontally scrollable feature cards (monochrome, glassy) */}
        <div className="w-full max-w-full px-2 mb-10">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
            {[
              { icon: <Zap className="w-8 h-8 text-foreground mx-auto" />, title: "Zero Latency", desc: "Real-time editing with instant preview. Every cut happens immediately." },
              { icon: <Wand2 className="w-8 h-8 text-foreground mx-auto" />, title: "AI Assistant", desc: "Smart suggestions that learn your style and automate repetitive tasks." },
              { icon: <Heart className="w-8 h-8 text-foreground mx-auto" />, title: "Creator DNA", desc: "Intuitive interface that feels like an extension of your creativity." },
              { icon: <Sparkles className="w-8 h-8 text-foreground mx-auto" />, title: "Vibe Engine", desc: "Transform raw footage into polished stories with one-click magic." },
            ].map((f, i) => (
              <div key={i} className="min-w-[260px] max-w-[90vw] bg-background/70 backdrop-blur-xl rounded-xl p-6 flex flex-col items-center snap-center shadow-lg border border-border/20">
                {f.icon}
                <div className="mt-3 text-lg font-bold text-center">{f.title}</div>
                <div className="text-xs text-muted-foreground text-center mt-2">{f.desc}</div>
              </div>
            ))}
          </div>
          {/* Dots (optional) */}
        </div>
        {/* Minimal Footer */}
        <div className="mt-auto mb-6 text-xs text-muted-foreground text-center w-full flex flex-col items-center gap-2">
          <span>Made with <span className="text-pink-400">❤️</span> by creators, for creators.</span>
          <div className="flex gap-4 justify-center mt-1">
            <a href="https://github.com/robinroy03/videoeditor" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Github className="w-5 h-5" /></a>
            <a href="https://twitter.com/trykimu" target="_blank" rel="noopener noreferrer" className="hover:text-primary"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 