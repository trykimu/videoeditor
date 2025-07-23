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
      subtext2: 'For creators who\'d rather be creating. If editing drains you — Kimu gives your time back.',
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
      <div className="hidden sm:block pt-20">
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
                    {typeof formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0) !== 'undefined' && formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0) && (
                      <div className="text-xs text-muted-foreground bg-muted/10 rounded px-2 py-1 border border-border/20 mb-2 relative z-20">
                        {formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0)} creators joined
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
      </div>

      {/* Mobile Only View */}
      <div className="sm:hidden">
        <MobileVideoEditorPreview 
          timelineAssets={timelineAssets} 
          handleLogoClick={handleLogoClick} 
          logoSpinning={logoSpinning}
          email={email}
          setEmail={setEmail}
          loading={loading}
          success={success}
          handleSubmit={handleSubmit}
        />
      </div>
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
    animation: any;
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
          {timelineAssets.map((asset: MobileTimelinePlaygroundProps['timelineAssets'][number], i: number) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`min-w-[90px] max-w-[120px] px-3 py-3 rounded-xl border border-border/30 bg-background/95 flex flex-col items-center gap-2 snap-center shadow-lg transition-all duration-200 ${activeIdx === i ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-105'} ${activeIdx === i ? 'z-20' : 'z-10'}`}
              style={{ opacity: activeIdx === i ? 1 : 0.7 }}
            >
              <span className="text-2xl mb-1">{asset.icon}</span>
              <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{asset.label}</span>
            </button>
          ))}
        </div>
        {/* Playhead */}
        <div className="absolute top-0 bottom-0 left-0 flex items-center pointer-events-none" style={{ left: `calc(${(activeIdx / (timelineAssets.length - 1)) * 100}% - 8px)` }}>
          <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg border-2 border-background" />
        </div>
      </div>
      {/* Editor Canvas - Modern Card */}
      <div className="w-full bg-gradient-to-br from-background/95 to-muted/60 border border-border/20 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 relative min-h-[200px]">
        {/* Mascot and Playful Animation */}
        <div className="flex items-center gap-3 mb-2">
          <div onClick={handleLogoClick} className="cursor-pointer select-none" style={{ display: 'inline-block' }}>
            <KimuLogo className={`w-10 h-10 text-foreground ${logoSpinning ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-lg font-bold text-foreground">Kimu Editor</span>
        </div>
        {/* Animated Feature Preview */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">{timelineAssets[activeIdx].heading}</span>
          <span className="text-base text-muted-foreground mb-1">{timelineAssets[activeIdx].desc}</span>
          <span className="text-sm text-muted-foreground mb-1">{timelineAssets[activeIdx].subtext}</span>
          <span className="text-xs text-muted-foreground mb-2">{timelineAssets[activeIdx].subtext2}</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {timelineAssets[activeIdx].badges.map((badge: string, j: number) => (
              <span key={j} className="px-2 py-1 rounded bg-muted/30 text-xs text-foreground border border-border/20 font-medium shadow-sm">{badge}</span>
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
        <span className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Video className="w-5 h-5 text-blue-400" /> Export Project</span>
        <form className="w-full flex flex-row items-center gap-2" onSubmit={e => { e.preventDefault(); setExporting(true); }}>
          <div className="flex-1 flex items-center bg-background/80 border border-border/30 rounded-lg px-2 py-1 shadow-inner">
            <Video className="w-4 h-4 text-blue-400 mr-2" />
            <input type="email" placeholder="your@email.com.mp4" className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/70" required disabled={exporting} />
          </div>
          <Button type="submit" className="h-9 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition-all" disabled={exporting}>
            <Download className="w-4 h-4" />
          </Button>
        </form>
        <div className="w-full h-2 bg-muted/30 rounded mt-2 overflow-hidden">
          <div className={`h-2 bg-blue-500 rounded transition-all duration-700 ${exporting ? 'w-full' : 'w-0'}`}></div>
        </div>
        <p className="text-xs text-muted-foreground text-left mt-1">
          Get notified when Kimu launches. No spam, just creative updates.
        </p>
      </div>
    </div>
  );
} 

// Fix linter errors for MobileStoryboardLanding
interface MobileStoryboardLandingProps {
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
    animation: any;
  }>;
  handleLogoClick: () => void;
  logoSpinning: boolean;
}

function MobileStoryboardLanding({ timelineAssets, handleLogoClick, logoSpinning }: MobileStoryboardLandingProps) {
  const [showTagline, setShowTagline] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  // Animation for ticket
  React.useEffect(() => {
    if (submitted) {
      const t = setTimeout(() => setSubmitted(false), 1200);
      return () => clearTimeout(t);
    }
  }, [submitted]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col items-stretch">
      {/* Director's Slate */}
      <div className="flex flex-col items-start px-6 pt-8 pb-4">
        <div className="relative flex items-center gap-3 mb-2">
          <div
            onClick={() => { setShowTagline((v) => !v); handleLogoClick(); }}
            className="cursor-pointer select-none flex flex-col items-center"
            style={{ width: 64 }}
          >
            {/* Clapperboard */}
            <div className={`w-16 h-6 bg-muted/80 rounded-t-md flex items-center justify-center relative transition-transform duration-300 ${logoSpinning || showTagline ? 'rotate-[-20deg]' : ''}`}
                 style={{ borderBottom: '4px solid #222' }}>
              <div className="w-10 h-2 bg-muted/40 rounded absolute left-3 top-2 rotate-[-10deg]" />
              <div className="w-3 h-2 bg-muted/60 rounded absolute right-2 top-2 rotate-[10deg]" />
            </div>
            <div className="w-16 h-10 bg-background rounded-b-md flex items-center justify-center border-x border-b border-border/30">
              <KimuLogo className="w-8 h-8 text-foreground" />
            </div>
          </div>
          <span className="text-xl font-bold text-foreground ml-2">Kimu Studio</span>
        </div>
        {showTagline && (
          <div className="text-sm text-muted-foreground mt-2 animate-fade-in-left">Edit less. Create more. 🎬</div>
        )}
      </div>
      {/* Storyboard Scenes */}
      <div className="flex flex-col gap-6 px-4 pb-6">
        {timelineAssets.map((asset: MobileStoryboardLandingProps['timelineAssets'][number], i: number) => (
          <div
            key={i}
            className="w-full bg-background/95 border border-border/20 rounded-xl shadow-lg p-5 flex flex-col gap-2 relative overflow-hidden animate-slide-up"
            style={{ borderLeft: `6px solid ${asset.color.split(' ')[2].replace('text-', '') || '#3b82f6'}` }}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{asset.icon}</span>
              <span className="text-lg font-bold text-foreground">{asset.heading}</span>
            </div>
            <div className="text-base font-semibold text-foreground mb-1">{asset.desc}</div>
            <div className="text-sm text-muted-foreground mb-1">{asset.subtext}</div>
            <div className="text-xs text-muted-foreground mb-2">{asset.subtext2}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              {asset.badges.map((badge: string, j: number) => (
                <span key={j} className="px-2 py-1 rounded bg-muted/30 text-xs text-foreground border border-border/20 font-medium shadow-sm">{badge}</span>
              ))}
            </div>
            {/* Animated accent: playhead, sparkle, cut, etc. */}
            <div className="absolute right-4 bottom-4 flex items-center gap-2 opacity-70">
              {i === 0 && <Video className="w-7 h-7 text-blue-400 animate-pulse" />}
              {i === 1 && <Sparkles className="w-7 h-7 text-yellow-400 animate-bounce" />}
              {i === 2 && <Zap className="w-7 h-7 text-blue-400 animate-pulse" />}
              {i === 3 && <Wand2 className="w-7 h-7 text-purple-400 animate-spin-slow" />}
              {i === 4 && <Heart className="w-7 h-7 text-pink-400 animate-pulse" />}
              {i === 5 && <Scissors className="w-7 h-7 text-foreground animate-bounce" />}
            </div>
            {/* Filmstrip edge */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-muted/30 rounded-l-xl flex flex-col justify-between py-2">
              <div className="w-1 h-1 bg-muted/60 rounded-full mb-1" />
              <div className="w-1 h-1 bg-muted/60 rounded-full mb-1" />
              <div className="w-1 h-1 bg-muted/60 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      {/* Waitlist as Movie Ticket */}
      <div className={`w-full max-w-xs mx-auto bg-background/95 border border-border/20 rounded-2xl shadow-2xl p-6 flex flex-col items-start gap-3 mb-8 mt-2 relative transition-all duration-500 ${submitted ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        <span className="text-lg font-bold text-foreground mb-1 flex items-center gap-2"><Video className="w-5 h-5 text-blue-400" /> Join the Cast</span>
        <form className="w-full flex flex-row items-center gap-2" onSubmit={e => { e.preventDefault(); setSubmitted(true); }}>
          <div className="flex-1 flex items-center bg-background/80 border border-border/30 rounded-lg px-2 py-1 shadow-inner">
            <Type className="w-4 h-4 text-blue-400 mr-2" />
            <input type="email" placeholder="your@email.com" className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground/70" required disabled={submitted} />
          </div>
          <Button type="submit" className="h-9 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow hover:bg-blue-600 transition-all" disabled={submitted}>
            <Download className="w-4 h-4" />
          </Button>
        </form>
        <div className="w-full h-2 bg-muted/30 rounded mt-2 overflow-hidden">
          <div className={`h-2 bg-blue-500 rounded transition-all duration-700 ${submitted ? 'w-full' : 'w-0'}`}></div>
        </div>
        <p className="text-xs text-muted-foreground text-left mt-1">
          Get notified when Kimu launches. No spam, just creative updates.
        </p>
        {/* Ticket stub edge */}
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-muted/30 rounded-r-2xl flex flex-col justify-between py-2">
          <div className="w-1 h-1 bg-muted/60 rounded-full mb-1" />
          <div className="w-1 h-1 bg-muted/60 rounded-full mb-1" />
          <div className="w-1 h-1 bg-muted/60 rounded-full" />
        </div>
      </div>
      {/* Minimal Footer */}
      <div className="w-full text-center text-xs text-muted-foreground pb-4">Made for creators, by creators.</div>
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
    animation: any;
  }>;
  handleLogoClick: () => void;
  logoSpinning: boolean;
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  success: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

function MobileVideoEditorPreview({ 
  timelineAssets, 
  handleLogoClick, 
  logoSpinning, 
  email, 
  setEmail, 
  loading, 
  success, 
  handleSubmit 
}: MobileVideoEditorProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(true); // Auto-play by default
  const [currentTime, setCurrentTime] = React.useState(0);
  const [showNavbarLogo, setShowNavbarLogo] = React.useState(false);

  // Scroll detection for logo placement
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowNavbarLogo(scrollTop > 300); // Increased threshold to hide navbar logo when main logo is visible
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play through sections with looping - Much faster
  React.useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
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
      <div className="pt-20">
        {/* Kimu Logo and Title Section - Center Aligned */}
        <div className="px-4 py-6 text-center">
          <motion.div
            onClick={handleLogoClick}
            animate={{ rotate: logoSpinning ? 360 : 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="cursor-pointer inline-block mb-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <KimuLogo className="w-16 h-16 text-foreground mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Kimu</h1>
          <p className="text-sm text-muted-foreground">The playful, modern video editor for creators</p>
        </div>

        {/* Desktop-style Waitlist Card for Mobile */}
        <div className="w-full px-4 py-8">
          <div className="max-w-sm mx-auto">
            <div className="bg-background/80 border border-border/20 rounded-xl shadow-lg p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-foreground">Join the waitlist</h3>
                <Sparkles className="w-5 h-5 text-muted-foreground" />
              </div>
              {typeof formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0) !== 'undefined' && formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0) && (
                <div className="text-xs text-muted-foreground bg-muted/10 rounded px-2 py-1 border border-border/20 mb-2">
                  {formatCreatorCount(typeof waitlistCount !== 'undefined' ? waitlistCount : 0)} creators joined
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
                  className="w-full h-9 text-xs bg-white/90 text-black hover:bg-white disabled:bg-white/50"
                >
                  {loading ? "Joining..." : success ? "✓ You're in!" : "Join Waitlist"}
                </Button>
              </form>
              {success && (
                <motion.div
                  className="text-xs text-white bg-white/20 rounded px-2 py-1 border border-white/30 mt-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  🎉 We'll notify you when it's ready!
                </motion.div>
              )}
              <p className="text-xs text-muted-foreground leading-relaxed mt-3 text-white/20">
                Get notified when Kimu launches. No spam, just updates on the future of video editing.
              </p>
            </div>
          </div>
        </div>

        {/* Video Editor App Window */}
        <div className="px-4 py-6">
          <div className="max-w-sm mx-auto bg-background/95 border border-border/20 rounded-xl shadow-xl overflow-hidden">
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
                  className="flex flex-col items-center"
                >
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
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7" 
                onClick={() => setPlaying(!playing)}
              >
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
                  <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                  <span>•</span>
                  <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
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
                    transition={{ duration: 0.1 }}
                  >
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rotate-45" />
                  </motion.div>
                </div>

                {/* Tracks Container */}
                <div className="space-y-1">
                  {timelineAssets.map((asset: MobileVideoEditorProps['timelineAssets'][number], i: number) => {
                    const trackStart = timelineAssets.slice(0, i).reduce((sum, a) => sum + a.duration, 0);
                    const trackProgress = Math.max(0, Math.min(1, (currentTime - trackStart) / asset.duration));
                    const isActive = i === activeIdx;
                    const isPast = currentTime > trackStart + asset.duration;
                    const isFuture = currentTime < trackStart;

                    // Calculate track width based on duration
                    const trackWidth = `${(asset.duration / totalDuration) * 100}%`;
                    const trackOffset = `${(trackStart / totalDuration) * 100}%`;

                    return (
                      <div key={i} className="flex items-center h-8">
                        {/* Track Label */}
                        <div className={`w-20 h-full ${isActive ? 'bg-blue-500/20' : 'bg-muted/20'} border-r border-border/20 flex items-center px-2`}>
                          <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-foreground'} truncate`}>Track {i + 1}</span>
                        </div>
                        
                        {/* Track Timeline */}
                        <div className="flex-1 h-full bg-muted/10 border-b border-border/20 relative">
                          {/* Track Background */}
                          <div 
                            className={`absolute top-0 bottom-0 ${asset.color} opacity-10 rounded-sm`}
                            style={{ 
                              left: trackOffset, 
                              width: trackWidth,
                              minWidth: '80px'
                            }}
                          />
                          
                          {/* Track Content */}
                          <div 
                            className={`absolute top-0 bottom-0 flex items-center px-2 rounded-sm border ${isActive ? 'border-blue-400/50' : 'border-border/30'}`}
                            style={{ 
                              left: trackOffset, 
                              width: trackWidth,
                              minWidth: '80px'
                            }}
                          >
                            <span className={`text-xs font-medium ${isActive ? 'text-blue-400' : 'text-foreground'} truncate`}>{asset.label}</span>
                          </div>

                          {/* Progress Fill */}
                          {!isFuture && (
                            <motion.div
                              className={`absolute top-0 bottom-0 ${isActive ? 'bg-blue-500' : asset.color} opacity-40 rounded-sm`}
                              style={{ 
                                left: trackOffset,
                                width: `${Math.min(trackProgress * 100, 100)}%`,
                                maxWidth: trackWidth
                              }}
                              animate={{ 
                                width: `${Math.min(trackProgress * 100, 100)}%`
                              }}
                              transition={{ duration: 0.1 }}
                            />
                          )}

                          {/* Track Status Indicators */}
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {isPast && (
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                            )}
                            {isActive && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            )}
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

        {/* Bottom Info */}
        <div className="px-4 pb-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Kimu: Edit less. Create more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
