import type { CallbackListener, PlayerRef } from "@remotion/player";
import {
  ChevronLeft,
  Download,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  Scissors,
  Settings,
  Star,
  Sun,
  Upload,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Custom video controls
import { useTheme } from "next-themes";
import { FullscreenButton, MuteButton } from "~/components/ui/video-controls";

// Components
import { toast } from "sonner";
import LeftPanel from "~/components/editor/LeftPanel";
import { RenderStatus } from "~/components/timeline/RenderStatus";
import { TimelineRuler } from "~/components/timeline/TimelineRuler";
import { TimelineTracks } from "~/components/timeline/TimelineTracks";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { VideoPlayer } from "~/video-compositions/VideoPlayer";

// Hooks
import { useMediaBin } from "~/hooks/useMediaBin";
import { useRenderer } from "~/hooks/useRenderer";
import { useRuler } from "~/hooks/useRuler";
import { useTimeline } from "~/hooks/useTimeline";

// Types and constants
import { useNavigate } from "react-router";
import { ChatBox } from "~/components/chat/ChatBox";
import { FPS, type Transition } from "~/components/timeline/types";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// GitHub SVG Component
const GitHubIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

// Discord SVG Component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export default function TimelineEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, setTheme } = useTheme();

  const navigate = useNavigate();

  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [isAutoSize, setIsAutoSize] = useState<boolean>(false);
  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(true);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false)

  const [selectedScrubberId, setSelectedScrubberId] = useState<string | null>(null);

  // video player media selection state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const {
    timeline,
    timelineWidth,
    zoomLevel,
    getPixelsPerSecond,
    getTimelineData,
    expandTimeline,
    handleAddTrack,
    handleDeleteTrack,
    getAllScrubbers,
    handleUpdateScrubber,
    handleDeleteScrubber,
    handleDeleteScrubbersByMediaBinId,
    handleDropOnTrack,
    handleSplitScrubberAtRuler,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomToPoint,
    handlePan,
    // Transition management
    handleAddTransitionToTrack,
    handleDeleteTransition,
    getConnectedElements,
    handleUpdateScrubberWithLocking,
  } = useTimeline();

  const {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
    contextMenu,
    handleContextMenu,
    handleDeleteFromContext,
    handleSplitAudioFromContext,
    handleCloseContextMenu
  } = useMediaBin(handleDeleteScrubbersByMediaBinId);

  const {
    rulerPositionPx,
    isDraggingRuler,
    handleRulerDrag,
    handleRulerMouseDown,
    handleRulerMouseMove,
    handleRulerMouseUp,
    handleScroll,
    updateRulerFromPlayer,
  } = useRuler(playerRef, timelineWidth, getPixelsPerSecond());

  const { isRendering, renderStatus, handleRenderVideo } = useRenderer();

  // Wrapper function for transition drop handler to match expected interface
  const handleDropTransitionOnTrackWrapper = (transition: Transition, trackId: string, dropLeftPx: number) => {
    handleAddTransitionToTrack(trackId, transition, dropLeftPx);
  };

  // Derived values
  const timelineData = getTimelineData();
  const durationInFrames = (() => {
    let maxEndTime = 0;

    // Calculate the maximum end time from all scrubbers
    // Since overlapping scrubbers are already positioned correctly, 
    // we just need the maximum end time
    timelineData.forEach((timelineItem) => {
      timelineItem.scrubbers.forEach((scrubber) => {
        if (scrubber.endTime > maxEndTime) maxEndTime = scrubber.endTime;
      });
    });

    return Math.ceil(maxEndTime * FPS);
  })();

  // Event handlers with toast notifications
  const handleAddMediaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        let successCount = 0;
        let errorCount = 0;

        // Process files sequentially to avoid overwhelming the system
        for (const file of fileArray) {
          try {
            await handleAddMediaToBin(file);
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Failed to add ${file.name}:`, error);
          }
        }

        if (successCount > 0 && errorCount > 0) {
          toast.warning(`Imported ${successCount} file${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
        } else if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? 's' : ''}`);
        }

        e.target.value = "";
      }
    },
    [handleAddMediaToBin]
  );

  const handleRenderClick = useCallback(() => {
    if (
      timelineData.length === 0 ||
      timelineData.every((item) => item.scrubbers.length === 0)
    ) {
      toast.error("No timeline to render. Add some media first!");
      return;
    }

    handleRenderVideo(
      getTimelineData,
      timeline,
      isAutoSize ? null : width,
      isAutoSize ? null : height
    );
    toast.info("Starting render...");
  }, [
    handleRenderVideo,
    getTimelineData,
    timeline,
    width,
    height,
    isAutoSize,
    timelineData,
  ]);

  const handleLogTimelineData = useCallback(() => {
    if (timelineData.length === 0) {
      toast.error("Timeline is empty");
      return;
    }
    console.log(JSON.stringify(getTimelineData(), null, 2));
    toast.success("Timeline data logged to console");
  }, [getTimelineData, timelineData]);

  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
  }, []);

  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
  }, []);

  const handleAutoSizeChange = useCallback((auto: boolean) => {
    setIsAutoSize(auto);
  }, []);

  const handleAddTextClick = useCallback(() => {
    navigate("/text-editor");
  }, [navigate]);

  const handleAddTrackClick = useCallback(() => {
    handleAddTrack();
  }, [handleAddTrack]);

  const handleSplitClick = useCallback(() => {
    if (!selectedScrubberId) {
      toast.error("Please select a scrubber to split first!");
      return;
    }

    if (timelineData.length === 0 ||
      timelineData.every((item) => item.scrubbers.length === 0)) {
      toast.error("No scrubbers to split. Add some media first!");
      return;
    }

    const splitCount = handleSplitScrubberAtRuler(rulerPositionPx, selectedScrubberId);
    if (splitCount === 0) {
      toast.info("Cannot split: ruler is not positioned within the selected scrubber");
    } else {
      setSelectedScrubberId(null); // Clear selection since original scrubber is replaced
      toast.success(`Split the selected scrubber at ruler position`);
    }
  }, [handleSplitScrubberAtRuler, rulerPositionPx, selectedScrubberId, timelineData]);

  const expandTimelineCallback = useCallback(() => {
    return expandTimeline(containerRef);
  }, [expandTimeline]);

  const handleScrollCallback = useCallback(() => {
    handleScroll(containerRef, expandTimelineCallback);
  }, [handleScroll, expandTimelineCallback]);

  // Play/pause controls with Player sync
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      if (player.isPlaying()) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    }
  }, []);

  // Sync player state with controls - simplified like original
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      const handlePlay: CallbackListener<"play"> = () => setIsPlaying(true);
      const handlePause: CallbackListener<"pause"> = () => setIsPlaying(false);
      const handleFrameUpdate: CallbackListener<"frameupdate"> = (e) => {
        // Update ruler position from player
        updateRulerFromPlayer(e.detail.frame);
      };

      player.addEventListener("play", handlePlay);
      player.addEventListener("pause", handlePause);
      player.addEventListener("frameupdate", handleFrameUpdate);

      return () => {
        player.removeEventListener("play", handlePlay);
        player.removeEventListener("pause", handlePause);
        player.removeEventListener("frameupdate", handleFrameUpdate);
      };
    }
  }, [updateRulerFromPlayer]);

  // Global spacebar play/pause functionality - like original
  useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      // Only handle spacebar when not focused on input elements
      if (event.code === "Space") {
        const target = event.target as HTMLElement;
        const isInputElement =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.isContentEditable;

        // If user is typing in an input field, don't interfere
        if (isInputElement) {
          return;
        }

        // Prevent spacebar from scrolling the page
        event.preventDefault();

        const player = playerRef.current;
        if (player) {
          if (player.isPlaying()) {
            player.pause();
            setIsPlaying(false);
          } else {
            player.play();
            setIsPlaying(true);
          }
        }
      }
    };

    // Add event listener to document for global capture
    document.addEventListener("keydown", handleGlobalKeyPress);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyPress);
    };
  }, []); // Empty dependency array since we're accessing playerRef.current directly


  // Fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/robinroy03/videoeditor');
        if (response.ok) {
          const data = await response.json();
          setStarCount(data.stargazers_count);
        }
      } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
      }
    };

    fetchStarCount();
  }, []);

  // Ruler mouse events
  useEffect(() => {
    if (isDraggingRuler) {
      const handleMouseMove = (e: MouseEvent) =>
        handleRulerMouseMove(e, containerRef);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleRulerMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleRulerMouseUp);
      };
    }
  }, [isDraggingRuler, handleRulerMouseMove, handleRulerMouseUp]);



  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground" onPointerDown={(e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }
      setSelectedItem(null);
    }}>
      {/* Ultra-minimal Top Bar */}
      <header className="h-9 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-medium tracking-tight">Video Editor</h1>
        </div>

        <div className="flex items-center gap-1">
          {/* GitHub Star Counter */}
          <a
            href="https://github.com/robinroy03/videoeditor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors text-xs"
          >
            <GitHubIcon className="h-3 w-3" />
            GitHub
            <span className="font-medium">
              {starCount !== null ? starCount.toLocaleString() : '...'}
            </span>
            <Star className="h-2.5 w-2.5" />
          </a>

          {/* Discord Link */}
          <a
            href="https://discord.com/invite/GSknuxubZK"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors text-xs"
            title="Join our Discord community"
          >
            <DiscordIcon className="h-3 w-3" />
            <span className="font-medium">Discord</span>
          </a>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-7 w-7 p-0 hover:bg-muted"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </Button>

          <Separator orientation="vertical" className="h-4 mx-1" />

          {/* Import/Export */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddMediaClick}
            className="h-7 px-2 text-xs"
          >
            <Upload className="h-3 w-3 mr-1" />
            Import
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRenderClick}
            disabled={isRendering}
            className="h-7 px-2 text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            {isRendering ? "Rendering..." : "Export"}
          </Button>
        </div>
      </header>

      {/* Main content area with chat extending to bottom */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left section with media bin, video preview, and timeline */}
        <ResizablePanel defaultSize={isChatMinimized ? 100 : 80}>
          <ResizablePanelGroup direction="vertical">
            {/* Top section with media bin and video preview */}
            <ResizablePanel defaultSize={65} minSize={40}>
              <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Media Bin & Tools */}
                <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full border-r border-border">
                    <LeftPanel
                      mediaBinItems={mediaBinItems}
                      onAddMedia={handleAddMediaToBin}
                      onAddText={handleAddTextToBin}
                      contextMenu={contextMenu}
                      handleContextMenu={handleContextMenu}
                      handleDeleteFromContext={handleDeleteFromContext}
                      handleSplitAudioFromContext={handleSplitAudioFromContext}
                      handleCloseContextMenu={handleCloseContextMenu}
                    />
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Video Preview Area */}
                <ResizablePanel defaultSize={75}>
                  <div className="h-full flex flex-col bg-background">
                    {/* Compact Top Bar */}
                    <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center justify-between px-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Resolution:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={width}
                            onChange={(e) =>
                              handleWidthChange(Number(e.target.value))
                            }
                            disabled={isAutoSize}
                            className="h-5 w-14 text-xs px-1 border-0 bg-muted/50"
                          />
                          <span>×</span>
                          <Input
                            type="number"
                            value={height}
                            onChange={(e) =>
                              handleHeightChange(Number(e.target.value))
                            }
                            disabled={isAutoSize}
                            className="h-5 w-14 text-xs px-1 border-0 bg-muted/50"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Switch
                            id="auto-size"
                            checked={isAutoSize}
                            onCheckedChange={handleAutoSizeChange}
                            className="scale-75"
                          />
                          <Label htmlFor="auto-size" className="text-xs">
                            Auto
                          </Label>
                        </div>

                        {/* Show chat toggle when minimized */}
                        {isChatMinimized && (
                          <>
                            <Separator
                              orientation="vertical"
                              className="h-4 mx-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsChatMinimized(false)}
                              className="h-6 px-2 text-xs"
                              title="Show Chat"
                            >
                              <ChevronLeft className="h-3 w-3 mr-1" />
                              Chat
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Video Preview */}
                    <div
                      className={`flex-1 ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-200/70"
                        } flex flex-col items-center justify-center p-3 border border-border/50 rounded-lg overflow-hidden shadow-2xl relative`}
                    >
                      <div
                        className="flex-1 flex items-center justify-center w-full">
                        <VideoPlayer
                          timelineData={timelineData}
                          durationInFrames={durationInFrames}
                          ref={playerRef}
                          compositionWidth={isAutoSize ? null : width}
                          compositionHeight={isAutoSize ? null : height}
                          timeline={timeline}
                          handleUpdateScrubber={handleUpdateScrubber}
                          selectedItem={selectedItem}
                          setSelectedItem={setSelectedItem}
                        />
                      </div>

                      {/* Custom Video Controls - Below Player */}
                      <div className="w-full flex items-center justify-center gap-2 mt-3 px-4">
                        {/* Left side controls */}
                        <div className="flex items-center gap-1">
                          <MuteButton playerRef={playerRef} />
                        </div>

                        {/* Center play/pause button */}
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={togglePlayback}
                            className="h-6 w-6 p-0"
                          >
                            {isPlaying ? (
                              <Pause className="h-3 w-3" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                          </Button>
                        </div>

                        {/* Right side controls */}
                        <div className="flex items-center gap-1">
                          <FullscreenButton playerRef={playerRef} />
                        </div>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline Area - spans width of left section */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <div className="h-full flex flex-col bg-muted/20">
                {/* Compact Timeline Header */}
                <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center justify-between px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Timeline</span>
                    <Badge
                      variant="outline"
                      className="text-xs h-4 px-1.5 font-mono"
                    >
                      {Math.round(((durationInFrames || 0) / FPS) * 10) / 10}s
                    </Badge>
                    {/* <span className="text-xs text-muted-foreground">• Mouse wheel to zoom</span> */}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomOut}
                        className="h-6 w-6 p-0 text-xs"
                        title="Zoom Out"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Badge
                        variant="secondary"
                        className="text-xs h-4 px-1.5 font-mono cursor-pointer hover:bg-secondary/80 transition-colors"
                        onClick={handleZoomReset}
                        title="Click to reset zoom to 100%"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleZoomIn}
                        className="h-6 w-6 p-0 text-xs"
                        title="Zoom In"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAddTrackClick}
                      className="h-6 px-2 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSplitClick}
                      className="h-6 px-2 text-xs"
                      title="Split selected scrubber at ruler position"
                    >
                      <Scissors className="h-3 w-3 mr-1" />
                      Split
                    </Button>
                    <Separator orientation="vertical" className="h-4 mx-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogTimelineData}
                      className="h-6 px-2 text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Debug
                    </Button>
                  </div>
                </div>

                {/* Timeline Ruler - Ultra compact */}
                <TimelineRuler
                  timelineWidth={timelineWidth}
                  rulerPositionPx={rulerPositionPx}
                  containerRef={containerRef}
                  onRulerDrag={handleRulerDrag}
                  onRulerMouseDown={handleRulerMouseDown}
                  pixelsPerSecond={getPixelsPerSecond()}
                />

                {/* Timeline Content */}
                <TimelineTracks
                  timeline={timeline}
                  timelineWidth={timelineWidth}
                  rulerPositionPx={rulerPositionPx}
                  containerRef={containerRef}
                  onScroll={handleScrollCallback}
                  onDeleteTrack={handleDeleteTrack}
                  onUpdateScrubber={handleUpdateScrubberWithLocking}
                  onDeleteScrubber={handleDeleteScrubber}
                  onDropOnTrack={handleDropOnTrack}
                  onDropTransitionOnTrack={handleDropTransitionOnTrackWrapper}
                  onDeleteTransition={handleDeleteTransition}
                  getAllScrubbers={getAllScrubbers}
                  expandTimeline={expandTimelineCallback}
                  onRulerMouseDown={handleRulerMouseDown}
                  pixelsPerSecond={getPixelsPerSecond()}
                  selectedScrubberId={selectedScrubberId}
                  onSelectScrubber={setSelectedScrubberId}
                  onZoom={handleZoomToPoint}
                  onPan={handlePan}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Conditionally render chat panel - extends full height */}
        {!isChatMinimized && (
          <>
            <ResizableHandle withHandle />

            {/* Right Panel - Chat (full height) */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
              <div className="h-full border-l border-border">
                <ChatBox
                  mediaBinItems={mediaBinItems}
                  handleDropOnTrack={handleDropOnTrack}
                  isMinimized={false}
                  onToggleMinimize={() => setIsChatMinimized(true)}
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                  timelineState={timeline}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Render Status as Toast */}
      {renderStatus && (
        <div className="fixed bottom-4 right-4 z-50">
          <RenderStatus renderStatus={renderStatus} />
        </div>
      )}
    </div>
  );
}
