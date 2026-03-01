import { useOutletContext } from "react-router";
import { useMemo, memo, useState, useCallback, useRef, useEffect } from "react";
import {
  FileVideo,
  FileImage,
  Type,
  Clock,
  Upload,
  Music,
  Trash2,
  SplitSquareHorizontal,
  ChevronDown,
  ChevronUp,
  List,
  Layers,
  ArrowUpDown,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Thumbnail } from "@remotion/player";
import { OffthreadVideo, Img, Video } from "remotion";
import { type MediaBinItem } from "./types";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface MediaBinProps {
  mediaBinItems: MediaBinItem[];
  isMediaLoading?: boolean;
  onAddMedia: (file: File) => Promise<void>;
  onAddText: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold",
  ) => void;
  contextMenu: {
    x: number;
    y: number;
    item: MediaBinItem;
  } | null;
  handleContextMenu: (e: React.MouseEvent, item: MediaBinItem) => void;
  handleDeleteFromContext: () => Promise<void>;
  handleSplitAudioFromContext: () => Promise<void>;
  handleCloseContextMenu: () => void;
}

// Memoized component for video thumbnails to prevent flickering
const VideoThumbnail = memo(({ mediaUrl, width, height }: { mediaUrl: string; width: number; height: number }) => {
  const VideoComponent = useMemo(() => {
    return () => <Video src={mediaUrl} />;
  }, [mediaUrl]);

  return (
    <div className="w-12 h-8 rounded border border-border/50 overflow-hidden bg-card">
      <Thumbnail
        component={VideoComponent}
        compositionWidth={width}
        compositionHeight={height}
        frameToDisplay={30}
        durationInFrames={1}
        fps={30}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
});

// Compact custom audio preview (no extra containers, minimal, design-token aware)
const AudioPreview = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const format = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrentTime(el.currentTime);
    setIsPlaying(!el.paused);
  }, []);

  const onLoaded = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    setCurrentTime(el.currentTime || 0);
    setIsPlaying(!el.paused);
  }, []);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const el = audioRef.current;
      const track = trackRef.current;
      if (!el || !track || duration <= 0) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = rect.width ? x / rect.width : 0;
      el.currentTime = pct * duration;
    },
    [duration],
  );

  const onPointerDownTrack = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      setIsScrubbing(true);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  useEffect(() => {
    if (!isScrubbing) return;
    const onMove = (e: PointerEvent) => seekFromClientX(e.clientX);
    const onUp = () => setIsScrubbing(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp as EventListener);
    };
  }, [isScrubbing, seekFromClientX]);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  }, []);

  return (
    <div className="w-full flex items-center gap-2 select-none">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 bg-transparent hover:bg-transparent"
        onClick={togglePlay}
        title={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </Button>
      <div
        ref={trackRef}
        onPointerDown={onPointerDownTrack}
        className="relative w-full h-0.5 rounded cursor-pointer bg-black/25 dark:bg-white/25">
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded"
          style={{
            width: `${duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0}%`,
          }}
        />
      </div>
      <div className="text-[11px] tabular-nums text-muted-foreground min-w-[84px] text-right">
        {format(currentTime)} / {format(duration)}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 bg-transparent hover:bg-transparent"
        onClick={toggleMute}
        title={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </Button>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoaded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

// This is required for the data router
export function loader() {
  return null;
}

export default function MediaBin() {
  const {
    mediaBinItems,
    isMediaLoading,
    onAddMedia,
    onAddText,
    contextMenu,
    handleContextMenu,
    handleDeleteFromContext,
    handleSplitAudioFromContext,
    handleCloseContextMenu,
  } = useOutletContext<MediaBinProps>();

  // Drag & Drop state for external file imports
  const [isDragOver, setIsDragOver] = useState(false);

  // Arrange & sorting state
  const [arrangeMode, setArrangeMode] = useState<"default" | "group">("default");
  const [sortBy, setSortBy] = useState<"default" | "name_asc" | "name_desc">("default");
  const [collapsed, setCollapsed] = useState<{
    [key in "videos" | "gifs" | "images" | "audio" | "text"]: boolean;
  }>({
    videos: false,
    gifs: false,
    images: false,
    audio: false,
    text: false,
  });

  const handleDragOverRoot = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only react to file drags from OS, not internal element drags
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeaveRoot = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    // Only reset when leaving the current target
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDropRoot = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files || []);

      const isAllowed = (file: File) => {
        const type = (file.type || "").toLowerCase();
        if (type.startsWith("video/") || type.startsWith("audio/") || type.startsWith("image/")) {
          return true; // includes GIF via image/gif
        }
        // Fallback by extension when MIME is missing
        const name = file.name.toLowerCase();
        const imageExts = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tiff", ".svg", ".heic", ".heif"];
        const videoExts = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".wmv", ".mts", ".m2ts", ".3gp", ".flv"];
        const audioExts = [".mp3", ".wav", ".aac", ".flac", ".m4a", ".ogg", ".opus", ".aiff", ".aif", ".wma"];
        const all = [...imageExts, ...videoExts, ...audioExts];
        return all.some((ext) => name.endsWith(ext));
      };

      const files = droppedFiles.filter(isAllowed);
      for (const file of files) {
        try {
          await onAddMedia(file);
        } catch (err) {
          console.error("Failed to import file via drop:", file.name, err);
        }
      }
    },
    [onAddMedia],
  );

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case "video":
        return <FileVideo className="h-4 w-4" />;
      case "image":
        return <FileImage className="h-4 w-4" />;
      case "text":
        return <Type className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      default:
        return <FileImage className="h-4 w-4" />;
    }
  };

  const isGif = (item: MediaBinItem) => {
    if (item.mediaType !== "image") return false;
    const name = (item.name || "").toLowerCase();
    const url = (item.mediaUrlLocal || item.mediaUrlRemote || "").toLowerCase();
    return name.endsWith(".gif") || url.includes(".gif");
  };

  const counts = useMemo(() => {
    const videos = mediaBinItems.filter((i) => i.mediaType === "video").length;
    const gifs = mediaBinItems.filter(isGif).length;
    const images = mediaBinItems.filter((i) => i.mediaType === "image" && !isGif(i)).length;
    const audio = mediaBinItems.filter((i) => i.mediaType === "audio").length;
    const text = mediaBinItems.filter((i) => i.mediaType === "text").length;
    const all = mediaBinItems.length;
    return { all, videos, images, gifs, audio, text };
  }, [mediaBinItems]);

  const defaultArrangedItems = useMemo(() => {
    if (sortBy === "name_asc") return [...mediaBinItems].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") return [...mediaBinItems].sort((a, b) => b.name.localeCompare(a.name));
    return mediaBinItems;
  }, [mediaBinItems, sortBy]);

  const groupedItems = useMemo(() => {
    const videos = mediaBinItems.filter((i) => i.mediaType === "video");
    const gifs = mediaBinItems.filter(isGif);
    const images = mediaBinItems.filter((i) => i.mediaType === "image" && !isGif(i));
    const audio = mediaBinItems.filter((i) => i.mediaType === "audio");
    const text = mediaBinItems.filter((i) => i.mediaType === "text");

    const maybeSort = (arr: MediaBinItem[]) => {
      if (sortBy === "name_asc") return [...arr].sort((a, b) => a.name.localeCompare(b.name));
      if (sortBy === "name_desc") return [...arr].sort((a, b) => b.name.localeCompare(a.name));
      return arr;
    };

    return {
      videos: maybeSort(videos),
      gifs: maybeSort(gifs),
      images: maybeSort(images),
      audio: maybeSort(audio),
      text: maybeSort(text),
    };
  }, [mediaBinItems, sortBy]);
  const renderThumbnail = (item: MediaBinItem) => {
    const mediaUrl = item.mediaUrlLocal || item.mediaUrlRemote;

    // Show icon for uploading items
    if (item.isUploading) {
      return <Upload className="h-8 w-8 animate-pulse text-muted-foreground" />;
    }

    // Show thumbnails for different media types
    switch (item.mediaType) {
      case "video":
        if (mediaUrl) {
          return (
            <VideoThumbnail mediaUrl={mediaUrl} width={item.media_width || 1920} height={item.media_height || 1080} />
          );
        }
        return <FileVideo className="h-8 w-8 text-muted-foreground" />;

      case "image":
        if (mediaUrl) {
          return (
            <div className="w-12 h-8 rounded border border-border/50 overflow-hidden bg-card">
              <img
                src={mediaUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <FileImage className="h-8 w-8 text-muted-foreground hidden" />
            </div>
          );
        }
        return <FileImage className="h-8 w-8 text-muted-foreground" />;

      case "text":
        return (
          <div className="w-12 h-8 rounded border border-border/50 bg-card flex items-center justify-center">
            <Type className="h-4 w-4 text-muted-foreground" />
          </div>
        );

      case "audio":
        return (
          <div className="w-12 h-8 rounded border border-border/50 bg-card flex items-center justify-center">
            <Music className="h-4 w-4 text-muted-foreground" />
          </div>
        );

      default:
        return <FileImage className="h-8 w-8 text-muted-foreground" />;
    }
  };

  // Preview overlay state
  const [previewItem, setPreviewItem] = useState<MediaBinItem | null>(null);
  const openPreview = useCallback((item: MediaBinItem) => {
    if (item.isUploading) return; // avoid preview while uploading
    setPreviewItem(item);
  }, []);
  const closePreview = useCallback(() => setPreviewItem(null), []);

  // Support closing preview with Escape key
  useEffect(() => {
    if (!previewItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePreview();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewItem, closePreview]);

  // Focus overlay so onKeyDown works if needed
  const overlayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (previewItem && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [previewItem]);

  return (
    <div
      className="h-full flex flex-col bg-background relative"
      onClick={handleCloseContextMenu}
      onDragOver={handleDragOverRoot}
      onDragEnter={handleDragOverRoot}
      onDragLeave={handleDragLeaveRoot}
      onDrop={handleDropRoot}>
      {/* Compact Header */}
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-medium text-foreground">Media Library</h3>
            <Badge variant="secondary" className="text-xs h-4 px-1.5 font-mono">
              {mediaBinItems.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Arrange segmented switch - subtle, no gray bg */}
            <div className="flex items-center gap-0.5 rounded-md border border-border/30 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 bg-transparent hover:bg-transparent ${
                  arrangeMode === "default" ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                }`}
                onClick={() => setArrangeMode("default")}
                title="Default order"
                aria-pressed={arrangeMode === "default"}>
                <List className="h-2 w-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-5 w-5 p-0 bg-transparent hover:bg-transparent ${
                  arrangeMode === "group" ? "text-primary" : "text-muted-foreground/70 hover:text-foreground"
                }`}
                onClick={() => setArrangeMode("group")}
                title="Smart Group"
                aria-pressed={arrangeMode === "group"}>
                <Layers className="h-2 w-2" />
              </Button>
            </div>

            {/* Removed filter button per request */}

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-muted-foreground/70 hover:text-foreground bg-transparent hover:bg-transparent"
                  title="Sort">
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuLabel className="text-[11px]">Sort</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setSortBy("default")}
                  className={`text-[12px] gap-2 ${sortBy === "default" ? "text-primary" : ""}`}
                  data-variant="ghost">
                  <ArrowUpDown className={`h-3 w-3 ${sortBy === "default" ? "text-primary" : ""}`} /> Original order
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("name_asc")}
                  className={`text-[12px] gap-2 ${sortBy === "name_asc" ? "text-primary" : ""}`}
                  data-variant="ghost">
                  <ChevronUp className={`h-3 w-3 ${sortBy === "name_asc" ? "text-primary" : ""}`} /> Name A–Z
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy("name_desc")}
                  className={`text-[12px] gap-2 ${sortBy === "name_desc" ? "text-primary" : ""}`}
                  data-variant="ghost">
                  <ChevronDown className={`h-3 w-3 ${sortBy === "name_desc" ? "text-primary" : ""}`} /> Name Z–A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Media Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 panel-scrollbar">
        {isMediaLoading && (
          <div className="px-0.5">
            <div className="indeterminate-line text-primary" />
          </div>
        )}
        {arrangeMode === "default" && (
          <>
            {defaultArrangedItems.map((item) => (
              <div
                key={item.id}
                className={`group p-2 border border-border/50 rounded-md transition-colors ${
                  item.isUploading ? "bg-accent/30 cursor-default" : "bg-card cursor-grab hover:bg-accent/50"
                }`}
                draggable={!item.isUploading}
                onDragStart={(e) => {
                  if (!item.isUploading) {
                    e.dataTransfer.setData("application/json", JSON.stringify(item));
                    console.log("Dragging item:", item.name);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onDoubleClick={() => openPreview(item)}>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">{renderThumbnail(item)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-xs font-medium truncate transition-colors ${
                          item.isUploading
                            ? "text-muted-foreground"
                            : "text-foreground group-hover:text-accent-foreground"
                        }`}>
                        {item.name}
                      </p>

                      {item.isUploading && typeof item.uploadProgress === "number" && (
                        <span className="text-xs text-muted-foreground font-mono">{item.uploadProgress}%</span>
                      )}
                    </div>

                    {item.isUploading && typeof item.uploadProgress === "number" && (
                      <div className="mt-1 mb-1">
                        <Progress value={item.uploadProgress} className="h-1" />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-auto">
                        {item.isUploading ? "uploading" : item.mediaType}
                      </Badge>
                      {(item.mediaType === "video" ||
                        item.mediaType === "audio" ||
                        item.mediaType === "groupped_scrubber") &&
                        item.durationInSeconds > 0 &&
                        !item.isUploading && (
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {item.durationInSeconds.toFixed(1)}s
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {defaultArrangedItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileImage className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-xs text-muted-foreground">No media files</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Import videos, images, or audio to get started
                </p>
              </div>
            )}
          </>
        )}

        {arrangeMode === "group" && (
          <div className="space-y-2">
            {[
              {
                key: "videos" as const,
                title: "Videos",
                items: groupedItems.videos,
                count: counts.videos,
              },
              {
                key: "gifs" as const,
                title: "GIFs",
                items: groupedItems.gifs,
                count: counts.gifs,
              },
              {
                key: "images" as const,
                title: "Images",
                items: groupedItems.images,
                count: counts.images,
              },
              {
                key: "audio" as const,
                title: "Audio",
                items: groupedItems.audio,
                count: counts.audio,
              },
              {
                key: "text" as const,
                title: "Text",
                items: groupedItems.text,
                count: counts.text,
              },
            ]
              .filter((section) => section.count > 0)
              .map((section) => (
                <div key={section.key} className="rounded-lg border border-border/40 bg-card/40 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs hover:bg-accent/40 transition-colors"
                    onClick={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [section.key]: !prev[section.key],
                      }))
                    }>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {section.key === "videos" && <FileVideo className="h-3 w-3" />}
                      {section.key === "gifs" && <FileImage className="h-3 w-3" />}
                      {section.key === "images" && <FileImage className="h-3 w-3" />}
                      {section.key === "audio" && <Music className="h-3 w-3" />}
                      {section.key === "text" && <Type className="h-3 w-3" />}
                      <span className="font-medium text-foreground/90">{section.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                        {section.count}
                      </Badge>
                      {collapsed[section.key] ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    </div>
                  </button>
                  {!collapsed[section.key] && (
                    <div className="p-2 space-y-1.5">
                      {section.items.map((item) => (
                        <div
                          key={item.id}
                          className={`group p-2 rounded-md border border-border/40 transition-colors ${
                            item.isUploading ? "bg-accent/30 cursor-default" : "bg-card hover:bg-accent/30"
                          }`}
                          draggable={!item.isUploading}
                          onDragStart={(e) => {
                            if (!item.isUploading) {
                              e.dataTransfer.setData("application/json", JSON.stringify(item));
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, item)}
                          onDoubleClick={() => openPreview(item)}>
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0">{renderThumbnail(item)}</div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`text-xs font-medium truncate ${
                                    item.isUploading ? "text-muted-foreground" : "text-foreground"
                                  }`}>
                                  {item.name}
                                </p>
                                {item.isUploading && typeof item.uploadProgress === "number" && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {item.uploadProgress}%
                                  </span>
                                )}
                              </div>

                              {item.isUploading && typeof item.uploadProgress === "number" && (
                                <div className="mt-1 mb-1">
                                  <Progress value={item.uploadProgress} className="h-1" />
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-auto">
                                  {item.isUploading ? "uploading" : item.mediaType}
                                </Badge>
                                {(item.mediaType === "video" || item.mediaType === "audio") &&
                                  item.durationInSeconds > 0 &&
                                  !item.isUploading && (
                                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                      <Clock className="h-2.5 w-2.5" />
                                      {item.durationInSeconds.toFixed(1)}s
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {counts.all === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileImage className="h-8 w-8 text-muted-foreground/50 mb-3" />
                <p className="text-xs text-muted-foreground">No media files</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Import videos, images, or audio to get started
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dropzone overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-background/80">
          <div className="absolute inset-2 border-2 border-dashed border-primary/80 rounded-md flex items-center justify-center">
            <div className="pointer-events-none text-center">
              <Upload className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-primary font-medium">Drop files to import</p>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg z-50 py-1 min-w-32"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}>
          <button
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            onClick={handleDeleteFromContext}>
            <Trash2 className="h-3 w-3" />
            Delete Media
          </button>
          {contextMenu.item.mediaType === "video" && (
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              onClick={handleSplitAudioFromContext}>
              <SplitSquareHorizontal className="h-3 w-3" />
              Split Audio
            </button>
          )}
        </div>
      )}

      {/* Preview overlay */}
      {previewItem && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60] bg-black/70"
          onClick={closePreview}
          onKeyDown={(e) => {
            if (e.key === "Escape") closePreview();
          }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true">
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-full max-w-[760px] max-h-[80vh] border border-border rounded-md bg-popover shadow-lg flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {previewItem.mediaType}
                  </Badge>
                  <p className="text-xs font-medium truncate pr-2">{previewItem.name}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={closePreview}>
                  Close
                </Button>
              </div>
              <div className="p-3 flex items-center justify-center overflow-auto">
                {previewItem.mediaType === "video" && (
                  <video
                    src={previewItem.mediaUrlLocal || previewItem.mediaUrlRemote || undefined}
                    controls
                    className="max-w-full max-h-[60vh] rounded"
                  />
                )}
                {previewItem.mediaType === "image" && (
                  <img
                    src={previewItem.mediaUrlLocal || previewItem.mediaUrlRemote || undefined}
                    alt={previewItem.name}
                    className="max-w-full max-h-[60vh] rounded object-contain border border-border/50"
                  />
                )}
                {previewItem.mediaType === "audio" && (
                  <AudioPreview src={previewItem.mediaUrlLocal || previewItem.mediaUrlRemote || ""} />
                )}
                {previewItem.mediaType === "text" && (
                  <div className="max-w-full max-h-[60vh] overflow-auto p-4 bg-card rounded border border-border/50">
                    <p className="text-sm whitespace-pre-wrap">{previewItem.text?.textContent || previewItem.name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
