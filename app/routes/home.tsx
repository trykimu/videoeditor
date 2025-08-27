import React, { useRef, useEffect, useCallback, useState } from "react";
import type { PlayerRef, CallbackListener } from "@remotion/player";
import {
  Moon,
  Sun,
  Play,
  Pause,
  Upload,
  Download,
  Settings,
  Plus,
  Minus,
  ChevronLeft,
  Scissors,
  Star,
  Bot,
  LogOut,
} from "lucide-react";

// Custom video controls
import { MuteButton, FullscreenButton } from "~/components/ui/video-controls";
import { useTheme } from "next-themes";

// Components
import LeftPanel from "~/components/editor/LeftPanel";
import { VideoPlayer } from "~/video-compositions/VideoPlayer";
import { RenderStatus } from "~/components/timeline/RenderStatus";
import { TimelineRuler } from "~/components/timeline/TimelineRuler";
import { TimelineTracks } from "~/components/timeline/TimelineTracks";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { ProfileMenu } from "~/components/ui/ProfileMenu";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/ui/resizable";
import { toast } from "sonner";

// Hooks
import { useTimeline } from "~/hooks/useTimeline";
import { useMediaBin } from "~/hooks/useMediaBin";
import { useRuler } from "~/hooks/useRuler";
import { useRenderer } from "~/hooks/useRenderer";

// Types and constants
import { FPS, type Transition } from "~/components/timeline/types";
import { Save as SaveIcon, ChevronRight, CornerUpLeft, CornerUpRight } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { ChatBox } from "~/components/chat/ChatBox";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { useAuth } from "~/hooks/useAuth";
import { AuthOverlay } from "~/components/ui/AuthOverlay";


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

// X (Twitter) SVG Component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2H21l-6.6 7.548L22 22h-6.8l-4.4-5.8L5.6 22H3l7.2-8.24L2 2h6.8l4 5.4L18.244 2Zm-1.2 18h1.88L8.08 4H6.2l10.844 16Z" />
  </svg>
);

export default function TimelineEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { resolvedTheme } = useTheme();

  const navigate = useNavigate();
  const params = useParams();
  const projectId = params?.id as string | undefined;
  const [projectName, setProjectName] = useState<string>("");

  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [isAutoSize, setIsAutoSize] = useState<boolean>(false);
  // Text fields for width/height to allow clearing while typing
  const [widthInput, setWidthInput] = useState<string>("1920");
  const [heightInput, setHeightInput] = useState<string>("1080");
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);

  // Keep inputs in sync if width/height change elsewhere
  useEffect(() => { setWidthInput(String(width)); }, [width]);
  useEffect(() => { setHeightInput(String(height)); }, [height]);

  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [starCount, setStarCount] = useState<number | null>(null);
  // Avoid initial blank render; don't delay render on a 'mounted' gate

  const [selectedScrubberId, setSelectedScrubberId] = useState<string | null>(null);

  // video player media selection state
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const {
    timeline,
    timelineWidth,
    zoomLevel,
    getPixelsPerSecond,
    getTimelineData,
    getTimelineState,
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
    // Transition management
    handleAddTransitionToTrack,
    handleDeleteTransition,
    getConnectedElements,
    handleUpdateScrubberWithLocking,
    setTimelineFromServer,
    // undo/redo
    undo,
    redo,
    canUndo,
    canRedo,
    snapshotTimeline,
  } = useTimeline();

  const {
    mediaBinItems,
    isMediaLoading,
    getMediaBinItems,
    setTextItems,
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

  // Hydrate project name and timeline from API
  useEffect(() => {
    (async () => {
      const id = projectId || (window.location.pathname.match(/\/project\/([^/]+)/)?.[1] ?? "");
      if (!id) return;
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { credentials: 'include' });
      if (!res.ok) {
        navigate('/projects');
        return;
      }
      const j = await res.json();
      setProjectName(j.project?.name || "Project");
      if (j.timeline) setTimelineFromServer(j.timeline);
      // Use saved textBinItems if present, else extract from timeline
      try {
        if (Array.isArray(j.textBinItems) && j.textBinItems.length) {
          const textItems: typeof mediaBinItems = j.textBinItems.map((t: any) => ({
            id: t.id,
            name: t.name,
            mediaType: 'text' as const,
            media_width: Number(t.media_width) || 0,
            media_height: Number(t.media_height) || 0,
            text: t.text || null,
            mediaUrlLocal: null,
            mediaUrlRemote: null,
            durationInSeconds: Number(t.durationInSeconds) || 0,
            isUploading: false,
            uploadProgress: null,
            left_transition_id: null,
            right_transition_id: null,
          }));
          setTextItems(textItems);
        } else {
          const perTrack = (j.timeline?.tracks || []).flatMap((t: any) => t.scrubbers || []);
          const allScrubbers: any[] = Array.isArray(j.timeline?.scrubbers)
            ? (j.timeline.scrubbers as any[]).concat(perTrack)
            : perTrack;
          const textItems: typeof mediaBinItems = (allScrubbers || [])
            .filter((s: any) => s && s.mediaType === 'text' && s.text)
            .map((s: any) => ({
              id: s.sourceMediaBinId || s.id,
              name: s.text?.textContent || 'Text',
              mediaType: 'text' as const,
              media_width: s.media_width || 0,
              media_height: s.media_height || 0,
              text: s.text || null,
              mediaUrlLocal: null,
              mediaUrlRemote: null,
              durationInSeconds: s.durationInSeconds || 0,
              isUploading: false,
              uploadProgress: null,
              left_transition_id: null,
              right_transition_id: null,
            }));
          if (textItems.length) setTextItems(textItems);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Re-link scrubbers to remote asset URLs after assets hydrate
  // Ensures images/videos/audios render after refresh (when local blob URLs are gone)
  useEffect(() => {
    if (isMediaLoading) return;
    if (!mediaBinItems || mediaBinItems.length === 0) return;

    const current = getTimelineState();
    let changed = false;

    const assetsByName = new Map(
      mediaBinItems
        .filter((i) => i.mediaType !== 'text' && i.mediaUrlRemote)
        .map((i) => [i.name, i])
    );

    const newTracks = current.tracks.map((track) => ({
      ...track,
      scrubbers: track.scrubbers.map((s) => {
        if (s.mediaType === 'text') return s;
        if (!s.mediaUrlRemote) {
          const match = assetsByName.get(s.name);
          if (match && match.mediaUrlRemote) {
            changed = true;
            return {
              ...s,
              mediaUrlRemote: match.mediaUrlRemote,
              sourceMediaBinId: match.id,
              media_width: match.media_width || s.media_width,
              media_height: match.media_height || s.media_height,
            };
          }
        }
        return s;
      }),
    }));

    if (changed) {
      setTimelineFromServer({ ...current, tracks: newTracks });
    }
  }, [isMediaLoading, mediaBinItems, getTimelineState, setTimelineFromServer]);

  

  // Save timeline to server
  const handleSaveTimeline = useCallback(async () => {
    try {
      toast.info("Saving state of the project...");
      const id = projectId || (window.location.pathname.match(/\/project\/([^/]+)/)?.[1] ?? "");
      if (!id) {
        toast.error("No project ID");
        return;
      }
      const timelineState = getTimelineState();
      // persist current text items alongside timeline
      const textItemsPayload = getMediaBinItems().filter(i => i.mediaType === 'text');
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeline: timelineState, textBinItems: textItemsPayload })
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Timeline saved");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save");
    }
  }, [getTimelineState, projectId]);

  // Global Ctrl/Cmd+S to save timeline (registered after handler is defined)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isInputEl = ((e.target as HTMLElement)?.tagName || "").match(/^(INPUT|TEXTAREA)$/) || (e.target as HTMLElement)?.isContentEditable;
      if (isInputEl) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault(); e.stopPropagation();
        handleSaveTimeline();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
        e.preventDefault(); e.stopPropagation();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 'z' && e.shiftKey) {
        e.preventDefault(); e.stopPropagation();
        redo();
        return;
      }
      // Delete selected item from Player (not just timeline scrubber)
      if (key === 'delete') {
        if (selectedItem) {
          e.preventDefault(); e.stopPropagation();
          handleDeleteScrubber(selectedItem);
          setSelectedItem(null);
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true } as AddEventListenerOptions);
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as AddEventListenerOptions);
  }, [handleSaveTimeline, undo, redo, selectedItem, handleDeleteScrubber, setSelectedItem]);

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

  const commitWidth = useCallback(() => {
    const parsed = Number(widthInput);
    const safe = !isFinite(parsed) || parsed <= 0 ? 1920 : parsed;
    setWidth(safe);
    setWidthInput(String(safe));
  }, [widthInput]);

  const commitHeight = useCallback(() => {
    const parsed = Number(heightInput);
    const safe = !isFinite(parsed) || parsed <= 0 ? 1080 : parsed;
    setHeight(safe);
    setHeightInput(String(safe));
  }, [heightInput]);

  const handleAutoSizeChange = useCallback((auto: boolean) => {
    setIsAutoSize(auto);
  }, []);

  const handleAddTextClick = useCallback(() => {
    navigate("/editor/text-editor");
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
          } else {
            player.play();
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

  // Timeline wheel zoom functionality
  useEffect(() => {
    const timelineContainer = containerRef.current;
    if (!timelineContainer) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl or Cmd is held
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const scrollDirection = e.deltaY > 0 ? -1 : 1;

        if (scrollDirection > 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    timelineContainer.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      timelineContainer.removeEventListener("wheel", handleWheel);
    };
  }, [handleZoomIn, handleZoomOut]);

  const { user, isLoading: isAuthLoading, isSigningIn, signInWithGoogle, signOut } = useAuth();

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
          <KimuLogo className="h-4 w-4" />
          <h1 className="text-sm font-medium tracking-tight">Kimu Studio</h1>
        </div>

        {/* Center project name */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-xs leading-none text-muted-foreground font-mono">{projectName || "Project"}</span>
        </div>

        <div className="flex items-center gap-1">

          {/* Save / Import / Export */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSaveTimeline}
            className="h-7 px-2 text-xs"
            title="Save timeline (Ctrl/Cmd+S)"
          >
            <SaveIcon className="h-3 w-3 mr-1" />
            Save
          </Button>

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

          {/* Auth status — keep avatar as the last item (right corner) */}
          {user ? (
            <ProfileMenu user={user} starCount={starCount} onSignOut={signOut} />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={signInWithGoogle}
              className="h-7 px-2 text-xs ml-1"
              title="Sign in with Google"
            >
              Sign in
            </Button>
          )}
        </div>
      </header>

      {/* Main content: Left panel full height, center preview+timeline, right chat always visible */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left Panel - Media Bin & Tools (full height) */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
                  <div className="h-full border-r border-border">
                    <LeftPanel
                      mediaBinItems={mediaBinItems}
              isMediaLoading={isMediaLoading}
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

        {/* Center Area: Preview and Timeline */}
        <ResizablePanel defaultSize={55}>
          <ResizablePanelGroup direction="vertical">
            {/* Preview Area */}
            <ResizablePanel defaultSize={65} minSize={40}>
                  <div className="h-full flex flex-col bg-background">
                    {/* Compact Top Bar */}
                    <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center justify-between px-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>Resolution:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                        value={widthInput}
                        onChange={(e) => { setWidthInput(e.target.value); const n = Number(e.target.value); if (isFinite(n) && n > 0) setWidth(n); }}
                        onBlur={commitWidth}
                        onKeyDown={(e) => { if (e.key === 'Enter') { commitWidth(); (e.currentTarget as HTMLInputElement).blur(); } }}
                            disabled={isAutoSize}
                            className="h-5 w-14 text-xs px-1 border-0 bg-muted/50"
                        ref={widthInputRef}
                          />
                          <span>×</span>
                          <Input
                            type="number"
                        value={heightInput}
                        onChange={(e) => { setHeightInput(e.target.value); const n = Number(e.target.value); if (isFinite(n) && n > 0) setHeight(n); }}
                        onBlur={commitHeight}
                        onKeyDown={(e) => { if (e.key === 'Enter') { commitHeight(); (e.currentTarget as HTMLInputElement).blur(); } }}
                            disabled={isAutoSize}
                            className="h-5 w-14 text-xs px-1 border-0 bg-muted/50"
                        ref={heightInputRef}
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

                    {!isChatMinimized && null}
                        {isChatMinimized && (
                          <>
                        <Separator orientation="vertical" className="h-4 mx-1" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsChatMinimized(false)}
                          className="h-6 w-6 p-0 text-primary"
                          title="Open Chat"
                            >
                          <KimuLogo className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Video Preview */}
                    <div
                  className={
                    "flex-1 bg-zinc-200/70 dark:bg-zinc-900 " +
                    "flex flex-col items-center justify-center p-3 border border-border/50 rounded-lg overflow-hidden shadow-2xl relative"
                  }
                >
                  <div className="flex-1 flex items-center justify-center w-full">
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
                        <div className="flex items-center gap-1">
                          <MuteButton playerRef={playerRef} />
                        </div>
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
                        <div className="flex items-center gap-1">
                          <FullscreenButton playerRef={playerRef} />
                        </div>
                      </div>
                    </div>
                  </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Timeline Area */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <div className="h-full flex flex-col bg-muted/20">
                <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center justify-between px-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Timeline</span>
                    <Badge
                      variant="outline"
                      className="text-xs h-4 px-1.5 font-mono"
                    >
                      {Math.round(((durationInFrames || 0) / FPS) * 10) / 10}s
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={undo}
                      disabled={!canUndo}
                      className="h-6 w-6 p-0"
                      title="Undo (Ctrl/Cmd+Z)"
                    >
                      <CornerUpLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={redo}
                      disabled={!canRedo}
                      className="h-6 w-6 p-0"
                      title="Redo (Ctrl/Cmd+Shift+Z)"
                    >
                      <CornerUpRight className="h-3 w-3" />
                    </Button>
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

                <TimelineRuler
                  timelineWidth={timelineWidth}
                  rulerPositionPx={rulerPositionPx}
                  containerRef={containerRef}
                  onRulerDrag={handleRulerDrag}
                  onRulerMouseDown={handleRulerMouseDown}
                  pixelsPerSecond={getPixelsPerSecond()}
                  scrollLeft={containerRef.current?.scrollLeft || 0}
                />

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
                  onBeginScrubberTransform={snapshotTimeline}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        {/* Right Panel - Chat (toggleable) */}
        {!isChatMinimized && (
          <>
            <ResizableHandle withHandle />
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
                  handleUpdateScrubber={handleUpdateScrubberWithLocking}
                  handleDeleteScrubber={handleDeleteScrubber}
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

      {/* Blocker overlay for unauthenticated users */}
      {!isAuthLoading && !user && (
        <AuthOverlay isLoading={isAuthLoading} isSigningIn={isSigningIn} onSignIn={signInWithGoogle} />
      )}
    </div>
  );
}
