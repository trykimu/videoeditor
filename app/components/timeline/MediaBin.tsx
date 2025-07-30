import { useOutletContext } from "react-router";
import { useMemo, memo } from "react";
import { FileVideo, FileImage, Type, Clock, Upload, Music, Trash2, SplitSquareHorizontal } from "lucide-react";
import { Thumbnail } from '@remotion/player';
import { OffthreadVideo, Img, Video } from 'remotion';
import { type MediaBinItem } from "./types";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";

interface MediaBinProps {
  mediaBinItems: MediaBinItem[];
  onAddMedia: (file: File) => Promise<void>;
  onAddText: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold"
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
const VideoThumbnail = memo(({ 
  mediaUrl, 
  width, 
  height 
}: { 
  mediaUrl: string; 
  width: number; 
  height: number; 
}) => {
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
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
});

// This is required for the data router
export function loader() {
  return null;
}

export default function MediaBin() {
  const { 
    mediaBinItems, 
    onAddMedia, 
    onAddText, 
    contextMenu, 
    handleContextMenu, 
    handleDeleteFromContext, 
    handleSplitAudioFromContext, 
    handleCloseContextMenu 
  } = useOutletContext<MediaBinProps>();

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
            <VideoThumbnail
              mediaUrl={mediaUrl}
              width={item.media_width || 1920}
              height={item.media_height || 1080}
            />
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
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
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

  return (
    <div className="h-full flex flex-col bg-background" onClick={handleCloseContextMenu}>
      {/* Compact Header */}
      <div className="p-2 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-foreground">Media Library</h3>
          <Badge variant="secondary" className="text-xs h-4 px-1.5 font-mono">
            {mediaBinItems.length}
          </Badge>
        </div>
      </div>

      {/* Media Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 panel-scrollbar">
        {mediaBinItems.map((item) => (
          <div
            key={item.id}
            className={`group p-2 border border-border/50 rounded-md transition-colors ${
              item.isUploading 
                ? "bg-accent/30 cursor-default" 
                : "bg-card cursor-grab hover:bg-accent/50"
            }`}
            draggable={!item.isUploading}
            onDragStart={(e) => {
              if (!item.isUploading) {
                e.dataTransfer.setData("application/json", JSON.stringify(item));
                console.log("Dragging item:", item.name);
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0">
                {renderThumbnail(item)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-medium truncate transition-colors ${
                    item.isUploading 
                      ? "text-muted-foreground" 
                      : "text-foreground group-hover:text-accent-foreground"
                  }`}>
                    {item.name}
                  </p>
                  
                  {item.isUploading && typeof item.uploadProgress === "number" && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.uploadProgress}%
                    </span>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {item.isUploading && typeof item.uploadProgress === "number" && (
                  <div className="mt-1 mb-1">
                    <Progress value={item.uploadProgress} className="h-1" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-xs px-1 py-0 h-auto"
                  >
                    {item.isUploading ? "uploading" : item.mediaType}
                  </Badge>

                  {(item.mediaType === "video" || item.mediaType === "audio") && item.durationInSeconds > 0 && !item.isUploading && (
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

        {mediaBinItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileImage className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-xs text-muted-foreground">No media files</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Import videos, images, or audio to get started
            </p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-popover border border-border rounded-md shadow-lg z-50 py-1 min-w-32"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            onClick={handleDeleteFromContext}
          >
            <Trash2 className="h-3 w-3" />
            Delete Media
          </button>
          {contextMenu.item.mediaType === 'video' && (
            <button
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
              onClick={handleSplitAudioFromContext}
            >
              <SplitSquareHorizontal className="h-3 w-3" />
              Split Audio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
