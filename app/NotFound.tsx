import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./components/ui/button";
import {
  Home,
  ArrowRight,
  Bot,
  MessageCircle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Clapperboard,
  Scissors,
  Image,
  Video,
  Music,
  Sparkles,
  Stars,
} from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound(): React.ReactElement {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCurrentStep(1);
    }, 800);

    const timer2 = setTimeout(() => {
      setIsTyping(true);
    }, 2500);

    const timer3 = setTimeout(() => {
      setIsTyping(false);
      setCurrentStep(2);
    }, 4000);

    const timer4 = setTimeout(() => {
      setCurrentStep(3);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 relative overflow-hidden">
      {/* Video Editor Background Interface - Animated Opacity Waves */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Menu Bar - Wave 1 */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-12 border-b-2 border-muted-foreground/30 bg-muted/20"
          animate={{
            opacity: [0.08, 0.12, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="flex items-center h-full px-4 gap-6">
            <div className="w-20 h-7 bg-muted-foreground/40 rounded"></div>
            <div className="w-16 h-7 bg-muted-foreground/40 rounded"></div>
            <div className="w-18 h-7 bg-muted-foreground/40 rounded"></div>
            <div className="w-14 h-7 bg-muted-foreground/40 rounded"></div>
          </div>
        </motion.div>

        {/* Left Panel - Media Bin - Wave 2 */}
        <motion.div
          className="absolute top-12 left-0 w-72 bottom-48 border-r-2 border-muted-foreground/30 bg-muted/15"
          animate={{
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <div className="h-10 border-b-2 border-muted-foreground/30 bg-muted/25 flex items-center px-4">
            <div className="w-20 h-5 bg-muted-foreground/40 rounded"></div>
          </div>
          <div className="p-4 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                {i % 3 === 0 ? (
                  <Video className="w-5 h-5 text-muted-foreground/60" />
                ) : i % 3 === 1 ? (
                  <Image className="w-5 h-5 text-muted-foreground/60" />
                ) : (
                  <Music className="w-5 h-5 text-muted-foreground/60" />
                )}
                <div className="w-24 h-4 bg-muted-foreground/40 rounded"></div>
                <div className="w-12 h-3 bg-muted-foreground/30 rounded text-xs"></div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Panel - Preview - Wave 3 */}
        <motion.div
          className="absolute top-12 right-0 w-96 h-80 border-l-2 border-b-2 border-muted-foreground/30 bg-muted/15"
          animate={{
            opacity: [0.05, 0.09, 0.05],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        >
          <div className="h-10 border-b-2 border-muted-foreground/30 bg-muted/25 flex items-center px-4">
            <div className="w-16 h-5 bg-muted-foreground/40 rounded"></div>
          </div>
          <div className="p-6">
            <div className="w-full h-48 border-2 border-muted-foreground/40 rounded-lg bg-muted/20 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Play className="w-12 h-12 text-muted-foreground/60" />
              </motion.div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <SkipBack className="w-6 h-6 text-muted-foreground/60" />
              <Play className="w-8 h-8 text-muted-foreground/60" />
              <SkipForward className="w-6 h-6 text-muted-foreground/60" />
              <Volume2 className="w-6 h-6 text-muted-foreground/60 ml-4" />
            </div>
          </div>
        </motion.div>

        {/* Bottom Timeline - Wave 4 */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-48 border-t-2 border-muted-foreground/30 bg-muted/15"
          animate={{
            opacity: [0.07, 0.11, 0.07],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          {/* Timeline ruler */}
          <div className="h-8 border-b-2 border-muted-foreground/30 bg-muted/25 flex items-center px-6">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="flex-1 text-sm text-muted-foreground/60 border-l border-muted-foreground/30 pl-2"
              >
                {i * 10}s
              </div>
            ))}
          </div>

          {/* Timeline tracks */}
          <div className="flex-1 space-y-1 p-2">
            {/* Video track */}
            <motion.div
              className="h-10 border border-muted-foreground/30 bg-muted/20 rounded flex items-center px-4"
              animate={{
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Video className="w-5 h-5 mr-3 text-muted-foreground/60" />
              <div className="flex gap-2">
                <div className="w-20 h-6 bg-blue-500/50 rounded"></div>
                <div className="w-16 h-6 bg-blue-500/50 rounded"></div>
                <div className="w-24 h-6 bg-blue-500/50 rounded"></div>
                <div className="w-12 h-6 bg-blue-500/50 rounded"></div>
              </div>
            </motion.div>

            {/* Audio track */}
            <motion.div
              className="h-10 border border-muted-foreground/30 bg-muted/10 rounded flex items-center px-4"
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              <Music className="w-5 h-5 mr-3 text-muted-foreground/60" />
              <div className="flex gap-2">
                <div className="w-32 h-6 bg-green-500/50 rounded"></div>
                <div className="w-20 h-6 bg-green-500/50 rounded"></div>
                <div className="w-16 h-6 bg-green-500/50 rounded"></div>
              </div>
            </motion.div>

            {/* Effects track */}
            <motion.div
              className="h-10 border border-muted-foreground/30 bg-muted/20 rounded flex items-center px-4"
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2.5,
              }}
            >
              <Scissors className="w-5 h-5 mr-3 text-muted-foreground/60" />
              <div className="flex gap-2">
                <div className="w-12 h-6 bg-purple-500/50 rounded"></div>
                <div className="w-8 h-6 bg-purple-500/50 rounded"></div>
                <div className="w-14 h-6 bg-purple-500/50 rounded"></div>
                <div className="w-10 h-6 bg-purple-500/50 rounded"></div>
              </div>
            </motion.div>
          </div>

          {/* Playhead - Animated */}
          <motion.div
            className="absolute top-8 left-40 w-1 h-32 bg-red-500/70 rounded"
            animate={{
              opacity: [0.7, 1, 0.7],
              scaleY: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Tools Panel - Wave 5 */}
        <motion.div
          className="absolute top-96 right-0 w-96 h-40 border-l-2 border-t-2 border-muted-foreground/30 bg-muted/15"
          animate={{
            opacity: [0.04, 0.08, 0.04],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        >
          <div className="h-10 border-b-2 border-muted-foreground/30 bg-muted/25 flex items-center px-4">
            <div className="w-20 h-5 bg-muted-foreground/40 rounded"></div>
          </div>
          <div className="p-4 grid grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="w-full h-10 border border-muted-foreground/30 rounded bg-muted/20"
                animate={{
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Enhanced floating elements for playful touch */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating video icons */}
        <motion.div
          className="absolute top-20 left-20"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Video className="w-6 h-6 text-primary/20" />
        </motion.div>

        <motion.div
          className="absolute top-40 right-32"
          animate={{
            y: [0, 12, 0],
            rotate: [0, -3, 3, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        >
          <Music className="w-5 h-5 text-accent/25" />
        </motion.div>

        <motion.div
          className="absolute bottom-32 left-1/3"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 8, -8, 0],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        >
          <Scissors className="w-4 h-4 text-purple-400/30" />
        </motion.div>

        <motion.div
          className="absolute top-1/3 left-16"
          animate={{
            y: [0, 18, 0],
            rotate: [0, -6, 6, 0],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        >
          <Image className="w-5 h-5 text-blue-400/25" />
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-20"
          animate={{
            y: [0, -12, 0],
            rotate: [0, 4, -4, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 6.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-400/30" />
        </motion.div>

        <motion.div
          className="absolute top-60 right-1/4"
          animate={{
            y: [0, 8, 0],
            rotate: [0, -2, 2, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        >
          <Stars className="w-3 h-3 text-indigo-400/25" />
        </motion.div>

        {/* Subtle gradient orbs for depth */}
        <motion.div
          className="absolute top-16 right-16 w-12 h-12 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-sm"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-12 w-8 h-8 bg-gradient-to-br from-accent/8 to-transparent rounded-full blur-sm"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10 px-4 sm:px-6">
        {/* 404 Display at Top - Enhanced */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative inline-block">
            <div className="flex items-center justify-center gap-2 sm:gap-4 text-6xl sm:text-7xl md:text-8xl font-bold text-muted/70 mb-3">
              <span className="tracking-tight">4</span>
              <motion.div
                animate={{
                  rotateY: [0, 10, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Clapperboard className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 text-muted/70 mx-1" />
              </motion.div>
              <span className="tracking-tight">4</span>
            </div>
            {/* Subtle glow effect */}
            {/* <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl blur-3xl -z-10"></div> */}
          </div>
        </motion.div>

        {/* Discord-style Chat Interface - No Card Background */}
        <div className="relative w-full max-w-lg mx-auto">
          {/* First message with avatar and username */}
          <motion.div
            className="flex items-start gap-3 mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: currentStep >= 1 ? 1 : 0,
              y: currentStep >= 1 ? 0 : 10,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-primary/25 shadow-sm"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Bot className="w-4 h-4 text-primary" />
            </motion.div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-semibold text-primary">Kimu</span>
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              </div>
              <div className="bg-muted/15 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-border/30 w-fit max-w-[280px] sm:max-w-xs">
                <p className="text-sm text-foreground">Hey there! 👋</p>
                <p className="text-sm text-muted-foreground mt-1">
                  I couldn't find that page for you. It seems to have
                  disappeared into the digital void...
                </p>
              </div>
            </div>
          </motion.div>

          {/* Second message - consecutive message */}
          <div className="flex items-start gap-3 mb-1">
            <div className="w-8 h-8 flex-shrink-0"></div>
            <div className="flex flex-col flex-1 min-w-0 relative">
              {/* Typing indicator */}
              <motion.div
                className="absolute top-0 left-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: isTyping ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-muted/20 rounded-2xl px-4 py-3 shadow-sm border border-border/30 w-fit">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                        />
                      ))}
                    </div>
                    {/* <span className="text-xs text-muted-foreground italic">
                      typing...
                    </span> */}
                  </div>
                </div>
              </motion.div>

              {/* Actual second message */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 5 }}
                animate={{
                  opacity: currentStep >= 2 && !isTyping ? 1 : 0,
                  y: currentStep >= 2 && !isTyping ? 0 : 5,
                }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <div className="bg-muted/15 rounded-2xl px-4 py-2.5 shadow-sm border border-border/30 w-fit max-w-[300px] sm:max-w-sm">
                  <p className="text-sm text-foreground mb-2">
                    But hey! 🎬 Need some{" "}
                    <span className="font-bold text-primary">
                      video editing magic
                    </span>
                    ?
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    I'm your AI-powered creative partner, ready to transform
                    your raw footage into{" "}
                    <span className="font-semibold text-foreground">
                      cinematic masterpieces
                    </span>
                    ! ✨
                  </p>
                  <p className="text-sm font-bold text-primary">
                    Let's create something amazing together! 🚀
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Third message - Button as message */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 flex-shrink-0"></div>
            <div className="flex flex-col flex-1 min-w-0 mt-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: currentStep >= 3 ? 1 : 0,
                  y: currentStep >= 3 ? 0 : 10,
                }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <Button
                  onClick={handleGoHome}
                  className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground hover:from-primary/95 hover:via-primary/90 hover:to-primary/85 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/25 border border-primary/30 rounded-2xl font-semibold text-sm relative overflow-hidden px-4 py-3 h-auto w-fit max-w-[300px] sm:max-w-sm"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <div className="flex items-center gap-2 relative z-10">
                    <MessageCircle className="w-4 h-4" />
                    <span>Start Creating with Kimu</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer - Enhanced */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div
            className="opacity-0"
            style={{
              opacity: currentStep >= 3 ? 1 : 0,
              transition: "opacity 0.6s ease 1s",
            }}
          >
            <p className="text-xs text-muted-foreground/30 font-medium">
              Ready to bring your vision to life? <br /> Let's dive into the
              editor!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}