import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { KimuLogo } from "../components/ui/KimuLogo";
import { Link } from "react-router";
import {
  CheckCircle,
  Clock,
  Circle,
  ArrowLeft,
  Github,
  Twitter,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize,
  Minimize,
  Settings,
  Sparkles,
  Zap,
  Wand2,
  Users,
  Smartphone,
  Building2,
  MapPin,
  Calendar,
  Folder,
} from "lucide-react";

// Timeline roadmap item as video clips
interface TimelineClip {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "planned";
  quarter: string;
  progress?: number;
  icon: React.ReactNode;
  color: string;
  duration: string;
  startTime: number; // in seconds
  clipLength: number; // in seconds
}

// Roadmap data as video timeline clips
const timelineClips: TimelineClip[] = [
  {
    id: "foundation",
    title: "Core Video Editor",
    description: "Essential video editing with timeline, tracks, and real-time preview",
    status: "completed",
    quarter: "Q4 2024",
    progress: 100,
    icon: <Zap className="w-4 h-4" />,
    color: "bg-green-500",
    duration: "3:42",
    startTime: 0,
    clipLength: 222
  },
  {
    id: "ai-assistant", 
    title: "AI-Powered Assistant",
    description: "Smart editing suggestions and automated workflows",
    status: "in-progress",
    quarter: "Q1 2025",
    progress: 75,
    icon: <Wand2 className="w-4 h-4" />,
    color: "bg-blue-500",
    duration: "2:18",
    startTime: 222,
    clipLength: 138
  },
  {
    id: "effects",
    title: "Advanced Effects",
    description: "Professional transitions, filters, and visual enhancements",
    status: "in-progress", 
    quarter: "Q1 2025",
    progress: 45,
    icon: <Sparkles className="w-4 h-4" />,
    color: "bg-purple-500",
    duration: "4:07",
    startTime: 360,
    clipLength: 247
  },
  {
    id: "collaboration",
    title: "Real-time Collaboration",
    description: "Work together on projects with team members",
    status: "planned",
    quarter: "Q2 2025",
    progress: 0,
    icon: <Users className="w-4 h-4" />,
    color: "bg-orange-500",
    duration: "5:33",
    startTime: 607,
    clipLength: 333
  },
  {
    id: "mobile",
    title: "Mobile App",
    description: "Edit on-the-go with mobile companion",
    status: "planned",
    quarter: "Q2 2025", 
    progress: 0,
    icon: <Smartphone className="w-4 h-4" />,
    color: "bg-pink-500",
    duration: "2:55",
    startTime: 940,
    clipLength: 175
  },
  {
    id: "enterprise",
    title: "Enterprise Features", 
    description: "Advanced tools for professional teams",
    status: "planned",
    quarter: "Q3 2025",
    progress: 0,
    icon: <Building2 className="w-4 h-4" />,
    color: "bg-indigo-500",
    duration: "6:21",
    startTime: 1115,
    clipLength: 381
  }
];

const totalDuration = 1496; // Total seconds

// Video Timeline Component
const VideoTimeline: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev >= totalDuration ? 0 : prev + 2);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalFormattedTime = formatTime(totalDuration);
  const currentFormattedTime = formatTime(currentTime);

  return (
    <div className="bg-black/90 rounded-xl border border-border/20 overflow-hidden">
      {/* Timeline Header */}
      <div className="bg-muted/10 border-b border-border/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Kimu_Development_Timeline.kimu</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Project</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>30 fps</span>
            <span>•</span>
            <span>4K</span>
          </div>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="bg-muted/5 border-b border-border/20 p-4">
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 bg-muted/20 rounded flex items-center justify-center hover:bg-muted/30 transition-colors">
            <SkipBack className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>
          <button className="w-8 h-8 bg-muted/20 rounded flex items-center justify-center hover:bg-muted/30 transition-colors">
            <SkipForward className="w-4 h-4 text-foreground" />
          </button>
          
          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{currentFormattedTime}</span>
              <span>{totalFormattedTime}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full">
              <motion.div
                className="h-full bg-blue-500 rounded-full"
                animate={{ width: `${(currentTime / totalDuration) * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <div className="w-16 h-1 bg-muted/30 rounded-full">
              <div className="w-3/4 h-full bg-muted-foreground rounded-full"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <button 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="w-6 h-6 bg-muted/20 rounded flex items-center justify-center hover:bg-muted/30 transition-colors"
            >
              <Minimize className="w-3 h-3 text-foreground" />
            </button>
            <span className="text-xs text-muted-foreground px-2">{Math.round(zoom * 100)}%</span>
            <button 
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              className="w-6 h-6 bg-muted/20 rounded flex items-center justify-center hover:bg-muted/30 transition-colors"
            >
              <Maximize className="w-3 h-3 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {/* Ruler */}
        <div className="relative mb-4">
          <div className="h-6 bg-muted/10 rounded border border-border/30 flex items-center">
            {Array.from({ length: Math.ceil(totalDuration / 60) }, (_, i) => (
              <div key={i} className="flex-1 min-w-16 text-center">
                <div className="text-xs text-muted-foreground font-mono">
                  {i}:00
                </div>
              </div>
            ))}
          </div>
          {/* Playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
            animate={{ left: `${(currentTime / totalDuration) * 100}%` }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 clip-path-triangle"></div>
          </motion.div>
        </div>

        {/* Video Tracks */}
        <div className="space-y-3">
          {/* Track 1: Development Milestones */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-foreground font-medium">Development Track</span>
              <span className="text-muted-foreground text-xs">• {timelineClips.length} clips</span>
            </div>
            <div className="relative h-16 bg-muted/10 rounded border border-border/30">
              {timelineClips.map((clip, index) => {
                const leftPosition = (clip.startTime / totalDuration) * 100;
                const width = (clip.clipLength / totalDuration) * 100;
                
                return (
                  <motion.div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 ${clip.color}/80 rounded border-l-2 border-white/50 cursor-pointer group overflow-hidden`}
                    style={{ 
                      left: `${leftPosition}%`, 
                      width: `${width}%`,
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                  >
                    <div className="h-full flex items-center px-2 text-white">
                      <div className="flex items-center gap-1 min-w-0">
                        {clip.icon}
                        <span className="text-xs font-medium truncate">{clip.title}</span>
                      </div>
                      {clip.status === "in-progress" && clip.progress && (
                        <div className="absolute inset-0 bg-white/20 rounded" 
                             style={{ width: `${clip.progress}%` }} />
                      )}
                    </div>
                    
                    {/* Clip Info Tooltip */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-black/90 text-white p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity z-30 min-w-48">
                      <div className="font-medium">{clip.title}</div>
                      <div className="text-white/70 text-xs mt-1">{clip.description}</div>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span>{clip.duration}</span>
                        <span>{clip.quarter}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Track 2: Release Timeline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-foreground font-medium">Release Track</span>
              <span className="text-muted-foreground text-xs">• Beta, Alpha, Production</span>
            </div>
            <div className="relative h-12 bg-muted/10 rounded border border-border/30">
              {/* Alpha Release */}
              <motion.div
                className="absolute top-1 bottom-1 bg-yellow-500/80 rounded border-l-2 border-white/50"
                style={{ left: "15%", width: "25%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">Alpha Release</span>
                </div>
              </motion.div>
              
              {/* Beta Release */}
              <motion.div
                className="absolute top-1 bottom-1 bg-orange-500/80 rounded border-l-2 border-white/50"
                style={{ left: "45%", width: "30%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">Beta Release</span>
                </div>
              </motion.div>
              
              {/* Production Release */}
              <motion.div
                className="absolute top-1 bottom-1 bg-green-500/80 rounded border-l-2 border-white/50"
                style={{ left: "80%", width: "18%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.9 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">v1.0</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Track 3: Platform Support */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-foreground font-medium">Platform Track</span>
              <span className="text-muted-foreground text-xs">• Web, Desktop, Mobile</span>
            </div>
            <div className="relative h-12 bg-muted/10 rounded border border-border/30">
              {/* Web Platform */}
              <motion.div
                className="absolute top-1 bottom-1 bg-blue-500/80 rounded border-l-2 border-white/50"
                style={{ left: "0%", width: "60%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">Web Platform</span>
                </div>
              </motion.div>
              
              {/* Desktop App */}
              <motion.div
                className="absolute top-1 bottom-1 bg-purple-500/80 rounded border-l-2 border-white/50"
                style={{ left: "40%", width: "35%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">Desktop App</span>
                </div>
              </motion.div>
              
              {/* Mobile App */}
              <motion.div
                className="absolute top-1 bottom-1 bg-pink-500/80 rounded border-l-2 border-white/50"
                style={{ left: "65%", width: "33%" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div className="h-full flex items-center px-2 text-white">
                  <span className="text-xs font-medium">Mobile App</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Roadmap() {
  const completedItems = timelineClips.filter(item => item.status === "completed").length;
  const totalItems = timelineClips.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with social links */}
      <header className="border-b border-border/10 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <KimuLogo className="w-6 h-6 text-foreground" />
              <span className="font-medium text-foreground">Development Timeline</span>
            </Link>
            
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
              <Link 
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Play className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">Development Timeline</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Like any great video production, Kimu's development follows a carefully orchestrated timeline. 
              Watch our progress unfold in real-time as we build the future of video editing.
            </p>
            
            {/* Project Stats */}
            <div className="inline-flex items-center gap-6 bg-muted/10 rounded-lg px-6 py-3 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{completedItems}</div>
                <div className="text-sm text-muted-foreground">Features Complete</div>
              </div>
              <div className="w-px h-8 bg-border/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{timelineClips.filter(i => i.status === "in-progress").length}</div>
                <div className="text-sm text-muted-foreground">In Development</div>
              </div>
              <div className="w-px h-8 bg-border/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{timelineClips.filter(i => i.status === "planned").length}</div>
                <div className="text-sm text-muted-foreground">Planned</div>
              </div>
              <div className="w-px h-8 bg-border/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{Math.round((completedItems / totalItems) * 100)}%</div>
                <div className="text-sm text-muted-foreground">Project Complete</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Video Timeline Interface */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <VideoTimeline />
        </motion.div>

        {/* Feature Details */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {timelineClips.map((clip, index) => (
            <motion.div
              key={clip.id}
              className="bg-background/60 backdrop-blur-sm border border-border/20 rounded-xl p-6 hover:border-border/40 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${clip.color} rounded-lg flex items-center justify-center text-white`}>
                    {clip.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{clip.title}</h3>
                    <p className="text-sm text-muted-foreground">{clip.quarter}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  clip.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                  clip.status === 'in-progress' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-muted/20 text-muted-foreground'
                }`}>
                  {clip.status === 'completed' ? 'Done' : 
                   clip.status === 'in-progress' ? 'Active' : 'Planned'}
                </div>
              </div>
              
              <p className="text-muted-foreground text-sm mb-4">{clip.description}</p>
              
              {clip.status === "in-progress" && clip.progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{clip.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${clip.color} rounded-full`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${clip.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20 text-xs text-muted-foreground">
                <span>Duration: {clip.duration}</span>
                <span>Track: Development</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-border/10">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Kimu. Every frame of development crafted with precision.
          </p>
        </div>
      </div>
    </div>
  );
} 