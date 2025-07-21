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
} from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showNavbarLogo, setShowNavbarLogo] = useState(false);

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
    
    fetchCount();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => (prev >= 154 ? 0 : prev + 1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
  const progress = (currentTime / 154) * 100;

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
                href="https://github.com/trykimu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/trykimu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="w-5 h-5" />
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
        <section className="py-8">
          <div className="max-w-[95vw] mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="bg-background/80 backdrop-blur-sm border border-border/20 rounded-xl overflow-hidden outline outline-2 outline-white/10"
            >
              {/* Top Menu Bar */}
              <div className="h-12 bg-muted/10 border-b border-border/20 flex items-center px-6 text-sm">
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

                <div className="ml-auto flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-muted-foreground">Connected</span>
                  </div>
                  <div className="w-px h-4 bg-border/30"></div>
                  <span className="text-muted-foreground">Project: Vibe_Coding_Video.kimu</span>
                </div>
              </div>

              {/* Main Editor Layout - Increased Height */}
              <div className="flex h-[750px] lg:h-[850px]">
                
                {/* Left Sidebar - Media Bin with Much More Translucent Elements */}
                <div className="w-64 bg-muted/5 border-r border-border/20 flex flex-col">
                  <div className="h-10 bg-muted/10 border-b border-border/20 flex items-center px-3 text-xs font-medium opacity-20">
                    <Folder className="w-4 h-4 mr-2 text-blue-500" />
                    Media Library
                  </div>
                  
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto opacity-15">
                    {[
                      { icon: Video, name: "Vibe_Coding.mp4", duration: "2:34", color: "text-blue-500" },
                      { icon: Music, name: "Lo_Fi_Beats.mp3", duration: "1:45", color: "text-green-500" },
                      { icon: Image, name: "Code_Editor.png", duration: "", color: "text-purple-500" },
                      { icon: Type, name: "Title_Card.txt", duration: "", color: "text-orange-500" },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded bg-background/30 hover:bg-background/50 transition-colors cursor-pointer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.1 }}
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{item.name}</div>
                          {item.duration && (
                            <div className="text-xs text-muted-foreground">{item.duration}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col min-w-0">
                  
                  {/* Preview Window - Better */}
                  <div className="flex-1 bg-black/90 relative flex items-center justify-center p-8">
                    <div className="relative w-full max-w-4xl aspect-video bg-black/80 rounded border border-border/30 overflow-hidden">
                      {/* Main Content - Better Aligned */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="space-y-8"
                        >
                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                            Think "vibe coding,"<br />
                            <span className="text-white/80">but for video editing</span>
                          </h1>
                          
                          <div className="space-y-6">
                            <p className="text-xl md:text-2xl text-white/70 max-w-3xl">
                              Creators save time while Kimu handles the heavy lifting.
                            </p>
                            <p className="text-lg text-white/60 max-w-2xl">
                              For creators who'd rather be creating. If editing drains you — Kimu gives your time back.
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-6">
                            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm py-2 px-4">
                              AI-Powered
                            </Badge>
                            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm py-2 px-4">
                              Zero Latency
                            </Badge>
                            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm text-sm py-2 px-4">
                              Creator DNA
                            </Badge>
                          </div>
                        </motion.div>
                      </div>

                      {/* Video Controls - Positioned Outside Content Area */}
                      <div className="absolute -bottom-2 left-8 right-8">
                        <div className="bg-black/70 backdrop-blur-md rounded-lg p-2 border border-white/10">
                          <div className="flex items-center gap-2 text-white text-sm">
                            <button className="hover:text-white/70 transition-colors p-1">
                              <SkipBack className="w-4 h-4" />
                            </button>
                            
                            <button 
                              onClick={() => setIsPlaying(!isPlaying)}
                              className="hover:text-white/80 transition-colors p-1"
                            >
                              {isPlaying ? (
                                <Pause className="w-5 h-5 text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white" />
                              )}
                            </button>
                            
                            <button className="hover:text-white/70 transition-colors p-1">
                              <SkipForward className="w-4 h-4" />
                            </button>
                            
                            <div className="flex-1 mx-3">
                              <div className="h-1 bg-white/20 rounded-full">
                                <motion.div 
                                  className="h-1 bg-white rounded-full"
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.1 }}
                                />
                              </div>
                            </div>
                            
                            <span className="text-xs text-white/70 font-mono">
                              {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / 2:34
                            </span>
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
                  <div className="h-32 bg-muted/5 border-t border-border/20">
                    <div className="h-full flex">
                      {/* Track Labels */}
                      <div className="w-20 bg-muted/10 border-r border-border/20">
                        {["Video", "Audio"].map((track, i) => (
                          <div key={i} className="h-16 border-b border-border/20 flex items-center px-2">
                            <span className="text-xs text-muted-foreground">{track}</span>
                          </div>
                        ))}
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

                        {/* Video Track */}
                        <div className="absolute top-4 left-0 right-0 h-16 border-b border-border/20 p-1">
                          <motion.div 
                            className="h-full bg-blue-500/20 rounded border border-blue-500/30 flex items-center px-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ width: "60%" }}
                            initial={{ width: 0 }}
                            animate={{ width: "60%" }}
                            transition={{ duration: 1, delay: 0.8 }}
                          >
                            <Video className="w-3 h-3 text-blue-400 mr-1" />
                            <span className="text-xs text-blue-400">Vibe Coding Video</span>
                          </motion.div>
                        </div>

                        {/* Audio Track */}
                        <div className="absolute top-20 left-0 right-0 h-16 p-1">
                          <motion.div 
                            className="h-full bg-green-500/20 rounded border border-green-500/30 flex items-center px-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                            style={{ width: "45%" }}
                            initial={{ width: 0 }}
                            animate={{ width: "45%" }}
                            transition={{ duration: 1, delay: 1 }}
                          >
                            <Music className="w-3 h-3 text-green-400 mr-1" />
                            <span className="text-xs text-green-400">Lo-Fi Beats</span>
                          </motion.div>
                        </div>

                        {/* Playhead */}
                        <motion.div
                          className="absolute top-4 bottom-0 w-px bg-red-500 z-10"
                          animate={{ left: `${progress}%` }}
                          transition={{ duration: 0.1 }}
                        >
                          <div className="absolute -top-2 -left-1 w-2 h-2 bg-red-500 rotate-45"></div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Inspector Panel */}
                <div className="w-80 bg-muted/5 border-l border-border/20 flex flex-col">
                  {/* <div className="h-10 bg-muted/10 border-b border-border/20 flex items-center px-3 text-xs font-medium">
                    <Settings className="w-4 h-4 mr-2 text-white" />
                    Inspector
                  </div> */}

                  <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                    {/* Waitlist Section - White Gradient Outline */}
                    <motion.div 
                      className="space-y-4 p-5 rounded-xl bg-background/80 backdrop-blur-sm relative"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      {/* White gradient border */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/40 via-white/20 to-white/40 p-[2px]">
                        <div className="h-full w-full rounded-xl bg-background/90 backdrop-blur-sm"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-md font-semibold text-foreground">Join the waitlist !</h3>
                          <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      
                      {formattedCreatorCount && !countLoading && (
                        <div className="text-xs text-muted-foreground bg-white/10 rounded px-2 py-1 border border-white/20">
                          {formattedCreatorCount} creators joined
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
                          className="text-xs text-white bg-white/20 rounded px-2 py-1 border border-white/30"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          🎉 We'll notify you when it's ready!
                        </motion.div>
                      )}

                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 text-white/20">
                          Get notified when Kimu launches. No spam, just updates on the future of video editing.
                        </p>
                      </div>
                    </motion.div>

                    {/* Lower Sections - Much More Translucent */}
                    <div className="space-y-6 opacity-10">
                      {/* AI Assistant Panel */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-2">
                          AI Assistant
                        </h4>
                        <div className="space-y-2">
                          <div className="text-xs p-2 bg-background/30 rounded border border-border/20">
                            <div className="text-purple-500 font-medium">✨ Auto-cut silence</div>
                            <div className="text-muted-foreground mt-1">3 segments detected</div>
                          </div>
                          <div className="text-xs p-2 bg-background/30 rounded border border-border/20">
                            <div className="text-blue-500 font-medium">🎨 Color enhance</div>
                            <div className="text-muted-foreground mt-1">Brightness +15%</div>
                          </div>
                        </div>
                      </div>

                      {/* Export Panel */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-2">
                          Export Settings
                        </h4>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div>Format: MP4</div>
                          <div>Quality: 4K (60fps)</div>
                          <div>Audio: 320 kbps</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Monochrome with Slight Accents */}
        <section className="py-24 px-6 bg-muted/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Built for creators, by creators
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every feature designed to get out of your way and let creativity flow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Zero Latency",
                  desc: "Real-time editing with instant preview. Every cut happens immediately.",
                  accent: "hover:border-yellow-500/30"
                },
                {
                  icon: <Wand2 className="w-6 h-6" />,
                  title: "AI Assistant",
                  desc: "Smart suggestions that learn your style and automate repetitive tasks.",
                  accent: "hover:border-purple-500/30"
                },
                {
                  icon: <Heart className="w-6 h-6" />,
                  title: "Creator DNA",
                  desc: "Intuitive interface that feels like an extension of your creativity.",
                  accent: "hover:border-pink-500/30"
                },
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "Vibe Engine", 
                  desc: "Transform raw footage into polished stories with one-click magic.",
                  accent: "hover:border-blue-500/30"
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className={`text-center group p-6 rounded-xl bg-muted/20 border border-muted/30 ${feature.accent} transition-all duration-300`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <div className="w-12 h-12 bg-background/60 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-background/80 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
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
                  href="https://github.com/trykimu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="https://twitter.com/trykimu" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted/20 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                  <Twitter className="w-5 h-5" />
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
                  <a href="https://github.com/trykimu" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    GitHub
                  </a>
                  <a href="https://twitter.com/trykimu" target="_blank" rel="noopener noreferrer" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Twitter
                  </a>
                  <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Discord
                  </a>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Contact</h4>
                <div className="space-y-2">
                  <a href="mailto:hello@kimu.app" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    hello@kimu.app
                  </a>
                  <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Support
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

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 mt-8 border-t border-border/10 gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Kimu. Creators save time while Kimu handles the heavy lifting.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <span>Made with ❤️ for creators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 