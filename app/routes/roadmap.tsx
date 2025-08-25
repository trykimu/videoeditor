import * as React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { KimuLogo } from "../components/ui/KimuLogo";
import { Link } from "react-router";
import {
  Github,
  Twitter,
  Play,
  Pause,
  ArrowLeft,
  Zap,
  Wand2,
  Sparkles,
  Users,
  Smartphone,
} from "lucide-react";

// Timeline items for different tracks
interface TimelineItem {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "planned";
  quarter: string;
  progress?: number;
  icon: React.ReactNode;
  color: string;
  startTime: number;
  duration: number;
}

// Track 1: Core Features
const coreFeatures: TimelineItem[] = [
  {
    id: "editor",
    title: "Core Editor",
    status: "completed",
    quarter: "Q4 2024",
    progress: 100,
    icon: <Zap className="w-3 h-3" />,
    color: "bg-green-500",
    startTime: 0,
    duration: 3
  },
  {
    id: "ai",
    title: "AI Assistant",
    status: "in-progress",
    quarter: "Q1 2025",
    progress: 75,
    icon: <Wand2 className="w-3 h-3" />,
    color: "bg-blue-500",
    startTime: 2,
    duration: 4
  }
];

// Track 2: Advanced Features
const advancedFeatures: TimelineItem[] = [
  {
    id: "effects",
    title: "Effects & Filters",
    status: "in-progress",
    quarter: "Q1 2025",
    progress: 45,
    icon: <Sparkles className="w-3 h-3" />,
    color: "bg-purple-500",
    startTime: 3,
    duration: 3
  },
  {
    id: "collaboration",
    title: "Collaboration",
    status: "planned",
    quarter: "Q2 2025",
    progress: 0,
    icon: <Users className="w-3 h-3" />,
    color: "bg-orange-500",
    startTime: 5,
    duration: 2
  }
];

// Track 3: Platform Expansion
const platformFeatures: TimelineItem[] = [
  {
    id: "mobile",
    title: "Mobile App",
    status: "planned",
    quarter: "Q2 2025",
    progress: 0,
    icon: <Smartphone className="w-3 h-3" />,
    color: "bg-pink-500",
    startTime: 6,
    duration: 3
  }
];

const maxTime = 9; // Total timeline duration

// Timeline Track Component
const TimelineTrack: React.FC<{ 
  title: string; 
  items: TimelineItem[]; 
  color: string;
  delay: number;
}> = ({ title, items, color, delay }) => {
  // Calculate current implementation progress
  const calculateProgress = () => {
    let totalProgress = 0;
    let totalWeight = 0;
    
    items.forEach(item => {
      if (item.status === 'completed') {
        totalProgress += item.duration;
      } else if (item.status === 'in-progress' && item.progress) {
        totalProgress += (item.duration * item.progress) / 100;
      }
      totalWeight += item.duration;
    });
    
    return totalWeight > 0 ? (totalProgress / totalWeight) * maxTime : 0;
  };

  const [currentTime, setCurrentTime] = useState(calculateProgress());
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev >= maxTime ? 0 : prev + 0.1);
      }, 100);
    } else {
      setCurrentTime(calculateProgress());
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 ${color} rounded-full`}></div>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="ml-auto w-6 h-6 bg-muted/20 rounded-full flex items-center justify-center hover:bg-muted/30 transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 text-foreground" />
          ) : (
            <Play className="w-3 h-3 text-foreground" />
          )}
        </button>
      </div>
      
      <div className="relative h-12 bg-muted/10 rounded-lg border border-border/20">
        {/* Playhead */}
        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
          animate={{ left: `${(currentTime / maxTime) * 100}%` }}
          transition={{ duration: 0.1 }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full"></div>
        </motion.div>

        {items.map((item, index) => {
          const leftPosition = (item.startTime / maxTime) * 100;
          const width = (item.duration / maxTime) * 100;
          
          return (
            <motion.div
              key={item.id}
              className={`absolute top-1 bottom-1 ${item.color}/80 rounded border-l-2 border-white/30 cursor-pointer group overflow-hidden`}
              style={{ 
                left: `${leftPosition}%`, 
                width: `${width}%`,
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: delay + index * 0.1 }}
              whileHover={{ scale: 1.02, zIndex: 10 }}
            >
              <div className="h-full flex items-center px-2 text-white">
                <div className="flex items-center gap-1 min-w-0">
                  {item.icon}
                  <span className="text-xs font-medium truncate">{item.title}</span>
                </div>
                {item.status === "in-progress" && item.progress && (
                  <div className="absolute inset-0 bg-white/20 rounded" 
                       style={{ width: `${item.progress}%` }} />
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black text-white p-3 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 min-w-40 border border-white/20 shadow-lg">
                <div className="font-medium text-white">{item.title}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                    item.status === 'in-progress' ? 'bg-blue-500/30 text-blue-300' :
                    'bg-gray-500/30 text-gray-300'
                  }`}>
                    {item.status === 'completed' ? 'Done' : 
                     item.status === 'in-progress' ? `${item.progress}%` : 'Planned'}
                  </span>
                  <span className="text-white/70 text-xs">{item.quarter}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default function Roadmap() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/10 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <KimuLogo className="w-6 h-6 text-foreground" />
              <span className="font-medium text-foreground">Roadmap</span>
            </Link>
            
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/robinroy03/videoeditor"
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
              <a
                href="https://discord.gg/24Mt5DGcbx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                  <path d="M14 12a1 1 0 1 0 2 0a1 1 0 0 0 -2 0"></path>
                  <path d="M15.5 17c0 1 1.5 3 2 3c1.5 0 2.833 -1.667 3.5 -3c0.667 -1.667 0.5 -5.833 -1.5 -11.5c-1.457 -1.015 -3 -1.34 -4.5 -1.5l-0.972 1.923a11.913 11.913 0 0 0 -4.053 0l-0.975 -1.923c-1.5 0.16 -3.043 0.485 -4.5 1.5c-2 5.667 -2.167 9.833 -1.5 11.5c0.667 1.333 2 3 3.5 3c0.5 0 2 -2 2 -3"></path>
                  <path d="M7 16.5c3.5 1 6.5 1 10 0"></path>
                </svg>
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

      {/* Main Timeline Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Roadmap Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Roadmap</h1>
          <h2 className="text-lg text-muted-foreground mb-2">Development Timeline</h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Track our progress as we build the future of video editing. Each timeline shows different feature tracks with projected implementation schedules.
          </p>
        </div>

        <div className="space-y-8">
          <TimelineTrack 
            title="Core Features" 
            items={coreFeatures} 
            color="bg-blue-500"
            delay={0}
          />
          <TimelineTrack 
            title="Advanced Features" 
            items={advancedFeatures} 
            color="bg-purple-500"
            delay={0.2}
          />
          <TimelineTrack 
            title="Platform Expansion" 
            items={platformFeatures} 
            color="bg-pink-500"
            delay={0.4}
          />
        </div>
      </div>
    </div>
  );
} 