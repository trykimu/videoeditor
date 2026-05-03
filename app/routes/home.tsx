import React, { useRef, useEffect, useCallback, useState } from "react";
import type { ImperativePanelHandle } from "react-resizable-panels";
import type { PlayerRef, CallbackListener } from "@remotion/player";
import {
  Play,
  Pause,
  Upload,
  Settings,
  Plus,
  Minus,
  Scissors,
  CornerUpLeft,
  CornerUpRight,
  File,
  Type,
  BetweenVerticalEnd,
  Bot,
  SlidersHorizontal,
  Clapperboard,
} from "lucide-react";

// Custom video controls
import { MuteButton, FullscreenButton } from "~/components/ui/video-controls";

// Components
import LeftPanel from "~/components/editor/LeftPanel";
import { VideoPlayer } from "~/video-compositions/VideoPlayer";
import { InspectorPanel } from "~/components/editor/InspectorPanel";
import { ExportPanel } from "~/components/editor/ExportPanel";
import { TimelineRuler } from "~/components/timeline/TimelineRuler";
import { TimelineTracks } from "~/components/timeline/TimelineTracks";
import { Button } from "~/components/ui/button";
import { ProfileMenu } from "~/components/ui/ProfileMenu";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "~/components/ui/resizable";
import axios from "axios";
import { toast } from "sonner";

// Hooks
import { useTimeline } from "~/hooks/useTimeline";
import { useMediaBin } from "~/hooks/useMediaBin";
import { useRuler } from "~/hooks/useRuler";
import { useRenderer } from "~/hooks/useRenderer";
import { useAuth } from "~/hooks/useAuth";

// Types and constants
import {
  FPS,
  type MediaBinItem,
  type TimelineState,
  type Transition,
  type TrackState,
  type ScrubberState,
} from "~/components/timeline/types";
import { useNavigate, useParams, useLocation } from "react-router";
import { ChatBox } from "~/components/chat/ChatBox";
import { KimuLogo } from "~/components/ui/KimuLogo";
import { GitHubRepoStatsSchema, ProjectStateResponseSchema, TimelineStateSchema } from "~/schemas";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  snapshot?: TimelineState | null;
}

export default function TimelineEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftPanelRef = useRef<ImperativePanelHandle | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const projectId = params?.id as string | undefined;
  const [projectName, setProjectName] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isUserExpandingSidebar, setIsUserExpandingSidebar] = useState<boolean>(false);

  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [isAutoSize, setIsAutoSize] = useState<boolean>(false);
  // Text fields for width/height to allow clearing while typing
  const [widthInput, setWidthInput] = useState<string>("1920");
  const [heightInput, setHeightInput] = useState<string>("1080");
  const widthInputRef = useRef<HTMLInputElement>(null);
  const heightInputRef = useRef<HTMLInputElement>(null);

  // Keep inputs in sync if width/height change elsewhere
  useEffect(() => {
    setWidthInput(String(width));
  }, [width]);
  useEffect(() => {
    setHeightInput(String(height));
  }, [height]);

  const [isChatMinimized, setIsChatMinimized] = useState<boolean>(false);
  const { user, signOut } = useAuth();

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [starCount, setStarCount] = useState<number | null>(null);
  // Avoid initial blank render; don't delay render on a 'mounted' gate

  const [selectedScrubberIds, setSelectedScrubberIds] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutoSave = useRef(false);
  const isInitialMountRef = useRef(true);

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
    handleGroupScrubbers,
    handleUngroupScrubber,
    handleMoveGroupToMediaBin,
    handleRippleEdit,
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
    handleAddGroupToMediaBin,
    contextMenu,
    handleContextMenu,
    handleDeleteFromContext,
    handleSplitAudioFromContext,
    handleCloseContextMenu,
  } = useMediaBin(handleDeleteScrubbersByMediaBinId);

  const [mediaArrangeMode, setMediaArrangeMode] = useState<"default" | "group">("default");
  const [mediaSortBy, setMediaSortBy] = useState<"default" | "name_asc" | "name_desc">("default");

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

  const { isRendering, renderProgress, handleRenderVideo } = useRenderer();
  const [sidebarMode, setSidebarMode] = useState<"default" | "inspector" | "export">("default");

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

  // Hydrate project name + timeline snapshot from backend
  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!projectId) return;
      try {
        const { data } = await axios.get(`/backend/projects/${encodeURIComponent(projectId)}`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        // Set the project name from the raw response without gating on the strict schema —
        // older saves predate the timeline shape and we don't want a parse failure to leave
        // the topbar showing "Project". The schema is still applied to the timeline below.
        const rawName: unknown = data?.project?.name;
        if (typeof rawName === "string" && rawName.length > 0) {
          setProjectName(rawName);
        }
        const parsed = ProjectStateResponseSchema.safeParse(data);
        if (!parsed.success) {
          if (import.meta.env?.DEV) {
            console.warn("Project response failed schema validation:", parsed.error.format());
          }
          return;
        }
        const strictTimeline = TimelineStateSchema.safeParse(parsed.data.timeline);
        if (strictTimeline.success) {
          const tl = strictTimeline.data as TimelineState;
          skipNextAutoSave.current = true;
          setTimelineFromServer(tl);
          setSaveStatus("saved");

          // Restore text media bin items from the saved timeline scrubbers.
          // Text clips aren't stored as renderer assets so they'd otherwise
          // disappear from the media bin on reload.
          const seenBinIds = new Set<string>();
          const textItems = tl.tracks.flatMap((track) =>
            track.scrubbers.flatMap((s) => {
              if (s.mediaType !== "text" || !s.text || seenBinIds.has(s.sourceMediaBinId)) return [];
              seenBinIds.add(s.sourceMediaBinId);
              return [{
                id: s.sourceMediaBinId,
                name: s.name,
                mediaType: "text" as const,
                media_width: 0,
                media_height: 0,
                text: s.text,
                mediaUrlLocal: null,
                mediaUrlRemote: null,
                durationInSeconds: 0,
                isUploading: false,
                uploadProgress: null,
                left_transition_id: null,
                right_transition_id: null,
                groupped_scrubbers: null,
              }];
            }),
          );
          if (textItems.length > 0) setTextItems(textItems);
        }
      } catch {
        if (isMounted) navigate("/projects");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [projectId, navigate, setTimelineFromServer]);

  const openSection = useCallback(
    (section: "media-bin" | "text-editor" | "transitions") => {
      // If we're in a non-default mode, just switch back to default and navigate
      if (sidebarMode !== "default") {
        setSidebarMode("default");
        if (isSidebarCollapsed) {
          leftPanelRef.current?.expand?.();
          setIsSidebarCollapsed(false);
          setIsUserExpandingSidebar(true);
          setTimeout(() => leftPanelRef.current?.resize?.(20), 0);
        }
        navigate(section);
        return;
      }

      const isProjectRoot = /^\/project\/[^/]+\/?$/.test(location.pathname);
      const isActive =
        (section === "media-bin" && (location.pathname.includes("/media-bin") || isProjectRoot)) ||
        (section !== "media-bin" && location.pathname.includes(`/${section}`));

      if (isActive) {
        if (isSidebarCollapsed) {
          leftPanelRef.current?.expand?.();
          setIsSidebarCollapsed(false);
          setIsUserExpandingSidebar(true);
          setTimeout(() => leftPanelRef.current?.resize?.(20), 0);
        } else {
          leftPanelRef.current?.collapse?.();
          setIsSidebarCollapsed(true);
        }
        return;
      }

      if (isSidebarCollapsed) {
        leftPanelRef.current?.expand?.();
        setIsSidebarCollapsed(false);
        setIsUserExpandingSidebar(true);
        setTimeout(() => leftPanelRef.current?.resize?.(20), 0);
      }
      navigate(section);
    },
    [sidebarMode, isSidebarCollapsed, navigate, location.pathname],
  );

  const openSidePanel = useCallback(
    (mode: "inspector" | "export") => {
      if (sidebarMode === mode) {
        setSidebarMode("default");
        return;
      }
      setSidebarMode(mode);
      if (isSidebarCollapsed) {
        leftPanelRef.current?.expand?.();
        setIsSidebarCollapsed(false);
        setIsUserExpandingSidebar(true);
        setTimeout(() => leftPanelRef.current?.resize?.(20), 0);
      }
    },
    [sidebarMode, isSidebarCollapsed],
  );

  const saveTimelineSilently = useCallback(async () => {
    const id = projectId;
    if (!id) throw new Error("No project ID");
    setSaveStatus("saving");
    await axios.put(`/backend/projects/${encodeURIComponent(id)}`, getTimelineState(), {
      withCredentials: true,
    });
    setSaveStatus("saved");
  }, [getTimelineState, projectId]);

  const handleSaveTimeline = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    try {
      toast.info("Saving state of the project...");
      await saveTimelineSilently();
      toast.success("Timeline saved");
    } catch (error) {
      console.error(error);
      setSaveStatus("unsaved");
      toast.error("Failed to save");
    }
  }, [saveTimelineSilently]);

  // Global Ctrl/Cmd+S to save timeline (registered after handler is defined)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isInputEl =
        ((e.target as HTMLElement)?.tagName || "").match(/^(INPUT|TEXTAREA)$/) ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInputEl) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        e.stopPropagation();
        handleSaveTimeline();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "z" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "z" && e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        redo();
        return;
      }
      // Delete selected item from Player (not just timeline scrubber)
      if (key === "delete") {
        if (selectedItem) {
          e.preventDefault();
          e.stopPropagation();
          handleDeleteScrubber(selectedItem);
          setSelectedItem(null);
          return;
        }
      }
    };
    window.addEventListener("keydown", onKeyDown, {
      capture: true,
    } as AddEventListenerOptions);
    return () =>
      window.removeEventListener("keydown", onKeyDown, {
        capture: true,
      } as AddEventListenerOptions);
  }, [handleSaveTimeline, undo, redo, selectedItem, handleDeleteScrubber, setSelectedItem]);

  // Debounced auto-save: fires 3s after the last meaningful timeline change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveTimelineSilently();
      } catch {
        setSaveStatus("unsaved");
      }
    }, 3000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [timeline, saveTimelineSilently]);

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
          toast.warning(`Imported ${successCount} file${successCount > 1 ? "s" : ""}, ${errorCount} failed`);
        } else if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} file${errorCount > 1 ? "s" : ""}`);
        }

        e.target.value = "";
      }
    },
    [handleAddMediaToBin],
  );

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

  // Handler for multi-selection with Ctrl+click support
  const handleSelectScrubber = useCallback((scrubberId: string | null, ctrlKey: boolean = false) => {
    if (scrubberId === null) {
      setSelectedScrubberIds([]);
      return;
    }

    if (ctrlKey) {
      setSelectedScrubberIds((prev) => {
        if (prev.includes(scrubberId)) {
          // If already selected, remove it
          return prev.filter((id) => id !== scrubberId);
        } else {
          // If not selected, add it
          return [...prev, scrubberId];
        }
      });
    } else {
      // Normal click - select only this scrubber
      setSelectedScrubberIds([scrubberId]);
    }
  }, []);

  const handleSplitClick = useCallback(() => {
    if (selectedScrubberIds.length === 0) {
      toast.error("Please select a scrubber to split first!");
      return;
    }

    if (selectedScrubberIds.length > 1) {
      toast.error("Please select only one scrubber to split!");
      return;
    }

    if (timelineData.length === 0 || timelineData.every((item) => item.scrubbers.length === 0)) {
      toast.error("No scrubbers to split. Add some media first!");
      return;
    }

    const splitCount = handleSplitScrubberAtRuler(rulerPositionPx, selectedScrubberIds[0]);
    if (splitCount === 0) {
      toast.info("Cannot split: ruler is not positioned within the selected scrubber");
    } else {
      setSelectedScrubberIds([]); // Clear selection since original scrubber is replaced
      toast.success(`Split the selected scrubber at ruler position`);
    }
  }, [handleSplitScrubberAtRuler, rulerPositionPx, selectedScrubberIds, timelineData]);

  // Handler for grouping selected scrubbers
  const handleGroupSelected = useCallback(() => {
    if (selectedScrubberIds.length < 2) {
      toast.error("Please select at least 2 scrubbers to group!");
      return;
    }

    handleGroupScrubbers(selectedScrubberIds);
    setSelectedScrubberIds([]); // Clear selection after grouping
    toast.success(`Grouped ${selectedScrubberIds.length} scrubbers`);
  }, [selectedScrubberIds, handleGroupScrubbers]);

  // Handler for ungrouping a grouped scrubber
  const handleUngroupSelected = useCallback(
    (scrubberId: string) => {
      handleUngroupScrubber(scrubberId);
      setSelectedScrubberIds([]); // Clear selection after ungrouping
      toast.success("Ungrouped scrubber");
    },
    [handleUngroupScrubber],
  );

  // Handler for moving grouped scrubber to media bin
  const handleMoveToMediaBinSelected = useCallback(
    (scrubberId: string) => {
      handleMoveGroupToMediaBin(scrubberId, handleAddGroupToMediaBin);
      setSelectedScrubberIds([]); // Clear selection after moving
    },
    [handleMoveGroupToMediaBin, handleAddGroupToMediaBin],
  );

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
        const response = await fetch("https://api.github.com/repos/robinroy03/videoeditor");
        if (response.ok) {
          const data = await response.json();
          const parsed = GitHubRepoStatsSchema.safeParse(data);
          if (parsed.success) setStarCount(parsed.data.stargazers_count);
        }
      } catch (error) {
        console.error("Failed to fetch GitHub stars:", error);
      }
    };

    fetchStarCount();
  }, []);

  // Ruler mouse events
  useEffect(() => {
    if (isDraggingRuler) {
      const handleMouseMove = (e: MouseEvent) => handleRulerMouseMove(e, containerRef);
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

  return (
    <div
      className="h-screen flex flex-col bg-background text-foreground"
      onPointerDown={(e: React.PointerEvent) => {
        if (e.button !== 0) {
          return;
        }
        setSelectedItem(null);
      }}>
      {/* Ultra-minimal Top Bar */}
      <header className="h-9 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <KimuLogo className="h-4 w-4" />
          <h1 className="text-sm font-medium tracking-tight">Kimu Studio</h1>
        </div>

        {/* Center: project name */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="text-xs leading-none text-muted-foreground font-mono">{projectName || "Project"}</span>
        </div>

        {/* Right: save status + Import */}
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="text-[10px] leading-none text-muted-foreground/50">saved</span>
          )}
          {saveStatus === "saving" && (
            <span className="text-[10px] leading-none text-muted-foreground">saving…</span>
          )}
          {saveStatus === "unsaved" && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0"
              title="Unsaved changes — Ctrl/Cmd+S to save"
            />
          )}
          <Button variant="ghost" size="sm" onClick={handleAddMediaClick} className="h-7 px-2 text-xs">
            <Upload className="h-3 w-3 mr-1" />
            Import
          </Button>
        </div>
      </header>

      {/* Main content with sidebar rail + editor panels */}
      <div className="flex flex-1 min-h-0">
        <div className="w-12 border-r border-border/50 bg-muted/30 flex flex-col items-center justify-between py-2">
          <div className="flex flex-col gap-1 items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                sidebarMode === "default" &&
                (location.pathname.includes("/media-bin") || /^\/project\/[^/]+\/?$/.test(location.pathname))
                  ? "bg-background text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => openSection("media-bin")}
              title="Media Bin">
              <File className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                sidebarMode === "default" && location.pathname.includes("/text-editor")
                  ? "bg-background text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => openSection("text-editor")}
              title="Text Editor">
              <Type className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                sidebarMode === "default" && location.pathname.includes("/transitions")
                  ? "bg-background text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => openSection("transitions")}
              title="Transitions">
              <BetweenVerticalEnd className="h-5 w-5" />
            </Button>

            <div className="w-6 border-t border-border/30 my-1" />

            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                sidebarMode === "inspector" ? "bg-background text-primary" : "text-muted-foreground"
              }`}
              onClick={() => openSidePanel("inspector")}
              title="Inspector">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-9 w-9 p-0 ${
                sidebarMode === "export" ? "bg-background text-primary" : "text-muted-foreground"
              }`}
              onClick={() => openSidePanel("export")}
              title="Export">
              <Clapperboard className="h-5 w-5" />
            </Button>
          </div>
          <div className="h-9 w-9 flex items-center justify-center">
            <ProfileMenu
              user={{ name: user?.name, email: user?.email, image: user?.image ?? undefined }}
              starCount={starCount}
              onSignOut={async () => {
                await signOut();
                window.location.assign("/login");
              }}
            />
          </div>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1"
          onLayout={(sizes: number[]) => {
            const leftSize = sizes?.[0] ?? 0;
            if (isSidebarCollapsed && leftSize > 0 && !isUserExpandingSidebar) {
              leftPanelRef.current?.collapse?.();
              setIsSidebarCollapsed(true);
              return;
            }
            if (isUserExpandingSidebar && leftSize >= 12) {
              setIsUserExpandingSidebar(false);
            }
            setIsSidebarCollapsed(leftSize < 1);
          }}>
          {/* Left Panel - Media Bin, Inspector, or Export */}
          <ResizablePanel ref={leftPanelRef} defaultSize={20} minSize={15} maxSize={40} collapsible collapsedSize={0}>
            <div className="h-full border-r border-border">
              {sidebarMode === "inspector" ? (
                <InspectorPanel
                  selectedScrubberIds={selectedScrubberIds}
                  getAllScrubbers={getAllScrubbers}
                  pixelsPerSecond={getPixelsPerSecond()}
                  onUpdate={handleUpdateScrubberWithLocking}
                />
              ) : sidebarMode === "export" ? (
                <ExportPanel
                  isRendering={isRendering}
                  renderProgress={renderProgress}
                  timeline={timeline}
                  timelineData={timelineData}
                  getTimelineData={getTimelineData}
                  getPixelsPerSecond={getPixelsPerSecond}
                  handleRenderVideo={handleRenderVideo}
                />
              ) : (
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
                  showTabs={false}
                  arrangeMode={mediaArrangeMode}
                  sortBy={mediaSortBy}
                  onArrangeModeChange={setMediaArrangeMode}
                  onSortByChange={setMediaSortBy}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className={isSidebarCollapsed ? "opacity-0 pointer-events-none" : undefined} />

          {/* Center Area: Preview and Timeline */}
          <ResizablePanel defaultSize={isChatMinimized ? 80 : 55}>
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
                          onChange={(e) => {
                            setWidthInput(e.target.value);
                            const n = Number(e.target.value);
                            if (isFinite(n) && n > 0) setWidth(n);
                          }}
                          onBlur={commitWidth}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitWidth();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
                          disabled={isAutoSize}
                          className="h-5 w-14 text-xs px-1 border-0 bg-muted/50"
                          ref={widthInputRef}
                        />
                        <span>×</span>
                        <Input
                          type="number"
                          value={heightInput}
                          onChange={(e) => {
                            setHeightInput(e.target.value);
                            const n = Number(e.target.value);
                            if (isFinite(n) && n > 0) setHeight(n);
                          }}
                          onBlur={commitHeight}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitHeight();
                              (e.currentTarget as HTMLInputElement).blur();
                            }
                          }}
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
                            title="Open Chat">
                            <Bot className="h-3 w-3" />
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
                    }>
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
                        getPixelsPerSecond={getPixelsPerSecond}
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
                        <Button variant="ghost" size="sm" onClick={togglePlayback} className="h-6 w-6 p-0">
                          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
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

              <ResizableHandle withHandle />

              {/* Timeline Area */}
              <ResizablePanel defaultSize={35} minSize={25}>
                <div className="h-full flex flex-col bg-muted/20">
                  <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center justify-between px-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">Timeline</span>
                      <Badge variant="outline" className="text-xs h-4 px-1.5 font-mono">
                        {Math.round(((durationInFrames || 0) / FPS) * 10) / 10}s
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={!canUndo}
                        className="h-6 w-6 p-0"
                        title="Undo (Ctrl/Cmd+Z)">
                        <CornerUpLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={redo}
                        disabled={!canRedo}
                        className="h-6 w-6 p-0"
                        title="Redo (Ctrl/Cmd+Shift+Z)">
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
                          title="Zoom Out">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Badge
                          variant="secondary"
                          className="text-xs h-4 px-1.5 font-mono cursor-pointer hover:bg-secondary/80 transition-colors"
                          onClick={handleZoomReset}
                          title="Click to reset zoom to 100%">
                          {Math.round(zoomLevel * 100)}%
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          className="h-6 w-6 p-0 text-xs"
                          title="Zoom In">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Separator orientation="vertical" className="h-4 mx-1" />
                      <Button variant="ghost" size="sm" onClick={handleAddTrackClick} className="h-6 px-2 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Track
                      </Button>
                      <Separator orientation="vertical" className="h-4 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSplitClick}
                        className="h-6 px-2 text-xs"
                        title="Split selected scrubber at ruler position">
                        <Scissors className="h-3 w-3 mr-1" />
                        Split
                      </Button>
                      <Separator orientation="vertical" className="h-4 mx-1" />
                      <Button variant="ghost" size="sm" onClick={handleLogTimelineData} className="h-6 px-2 text-xs">
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
                    selectedScrubberIds={selectedScrubberIds}
                    onSelectScrubber={handleSelectScrubber}
                    onGroupScrubbers={handleGroupSelected}
                    onUngroupScrubber={handleUngroupSelected}
                    onMoveToMediaBin={handleMoveToMediaBinSelected}
                    onBeginScrubberTransform={snapshotTimeline}
                    onRippleEdit={handleRippleEdit}
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
                    pixelsPerSecond={getPixelsPerSecond()}
                    handleAddTrack={handleAddTrack}
                    restoreTimeline={setTimelineFromServer}
                  />
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

    </div>
  );
}
