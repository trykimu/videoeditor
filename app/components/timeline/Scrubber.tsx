import React, { useState, useRef, useCallback, useEffect } from "react";
import { DEFAULT_TRACK_HEIGHT, type ScrubberState, type Transition } from "./types";
import { DEFAULT_TRACK_HEIGHT, type ScrubberState } from "./types";
import { Trash2, Edit, Volume2, VolumeX, Settings } from "lucide-react";
import { TextPropertiesEditor } from "./TextPropertiesEditor";
import { VolumeControl } from "./VolumeControl";

// something something for the css not gonna bother with it for now
export interface SnapConfig {
  enabled: boolean;
  distance: number; // snap distance in pixels
}

export interface ScrubberProps {
  scrubber: ScrubberState;
  timelineWidth: number;
  otherScrubbers: ScrubberState[];
  onUpdate: (updatedScrubber: ScrubberState) => void;
  onDelete?: (scrubberId: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  expandTimeline: () => boolean;
  snapConfig: SnapConfig;
  trackCount: number;
  pixelsPerSecond: number;
  isSelected?: boolean;
  onSelect?: (scrubberId: string) => void;
  // Add transitions prop to check for overlapping allowance
  transitions?: Transition[];
}

export const Scrubber: React.FC<ScrubberProps> = ({
  scrubber,
  timelineWidth,
  otherScrubbers,
  onUpdate,
  onDelete,
  containerRef,
  expandTimeline,
  snapConfig,
  trackCount,
  pixelsPerSecond,
  isSelected = false,
  onSelect,
  transitions = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeMode, setResizeMode] = useState<"left" | "right" | null>(null);
  const dragStateRef = useRef({
    offsetX: 0,
    startX: 0,
    startLeft: 0,
    startWidth: 0,
  });
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingVolume, setIsEditingVolume] = useState(false);

  const MINIMUM_WIDTH = 20;

  // Get snap points (scrubber edges and grid marks)
  const getSnapPoints = useCallback(
    (excludeId?: string) => {
      const snapPoints: number[] = [];

      // Add grid marks based on current zoom level
      for (let pos = 0; pos <= timelineWidth; pos += pixelsPerSecond) {
        snapPoints.push(pos);
      }

      // Add scrubber edges
      otherScrubbers.forEach((other) => {
        if (other.id !== excludeId) {
          snapPoints.push(other.left);
          snapPoints.push(other.left + other.width);
        }
      });

      return snapPoints;
    },
    [otherScrubbers, timelineWidth, pixelsPerSecond]
  );

  // Find nearest snap point
  const findSnapPoint = useCallback(
    (position: number, excludeId?: string): number => {
      if (!snapConfig.enabled) return position;

      const snapPoints = getSnapPoints(excludeId);

      for (const snapPos of snapPoints) {
        if (Math.abs(position - snapPos) < snapConfig.distance) {
          return snapPos;
        }
      }

      return position;
    },
    [snapConfig, getSnapPoints]
  );

  // Check if there's a transition between two scrubbers that allows overlap
  const hasTransitionBetween = useCallback(
    (scrubber1Id: string, scrubber2Id: string) => {
      return transitions.some(
        (transition) =>
          (transition.leftScrubberId === scrubber1Id && transition.rightScrubberId === scrubber2Id) ||
          (transition.leftScrubberId === scrubber2Id && transition.rightScrubberId === scrubber1Id)
      );
    },
    [transitions]
  );

  // Check collision with track awareness - allow overlap if transition exists
  const checkCollisionWithTrack = useCallback(
    (newScrubber: ScrubberState, excludeId?: string) => {
      return otherScrubbers.some((other) => {
        if (other.id === excludeId || other.y !== newScrubber.y) return false;

        const otherStart = other.left;
        const otherEnd = other.left + other.width;
        const newStart = newScrubber.left;
        const newEnd = newScrubber.left + newScrubber.width;

        const hasOverlap = !(newEnd <= otherStart || newStart >= otherEnd);
        
        // If there's overlap, check if there's a transition that allows it
        if (hasOverlap && hasTransitionBetween(newScrubber.id, other.id)) {
          return false; // Allow overlap due to transition
        }

        return hasOverlap;
      });
    },
    [otherScrubbers, hasTransitionBetween]
  );

  const getScrubberBounds = useCallback(
    (scrubber: ScrubberState) => {
      const scrollLeft = containerRef.current?.scrollLeft || 0;
      return {
        left: scrubber.left + scrollLeft,
        right: scrubber.left + scrubber.width + scrollLeft,
      };
    },
    [containerRef]
  );

  const checkCollision = useCallback(
    (scrubber1: ScrubberState, scrubber2: ScrubberState) => {
      const bounds1 = getScrubberBounds(scrubber1);
      const bounds2 = getScrubberBounds(scrubber2);
      return !(bounds1.right <= bounds2.left || bounds1.left >= bounds2.right);
    },
    [getScrubberBounds]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "drag" | "resize-left" | "resize-right") => {
      e.preventDefault();
      e.stopPropagation();

      // Select the scrubber when clicked
      if (onSelect) {
        onSelect(scrubber.id);
      }

      // Prevent resizing for video and audio media
      if ((mode === "resize-left" || mode === "resize-right") && (scrubber.mediaType === "video" || scrubber.mediaType === "audio")) {
        return;
      }

      if (mode === "drag") {
        setIsDragging(true);
        dragStateRef.current.offsetX = e.clientX - scrubber.left;
      } else {
        setIsResizing(true);
        setResizeMode(mode === "resize-left" ? "left" : "right");
        dragStateRef.current.startX = e.clientX;
        dragStateRef.current.startLeft = scrubber.left;
        dragStateRef.current.startWidth = scrubber.width;
      }
    },
    [scrubber, onSelect]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      // Remove throttling and requestAnimationFrame for responsive dragging
      if (isDragging) {
        let rawNewLeft = e.clientX - dragStateRef.current.offsetX;
        const min = 0;
        const max = timelineWidth - scrubber.width;
        rawNewLeft = Math.max(min, Math.min(max, rawNewLeft));

        // Calculate track changes based on mouse Y position with scroll offset
        let newTrack = scrubber.y || 0;
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const scrollTop = containerRef.current.scrollTop || 0;
          const mouseY = e.clientY - containerRect.top + scrollTop;
          const trackIndex = Math.floor(mouseY / DEFAULT_TRACK_HEIGHT);
          newTrack = Math.max(0, Math.min(trackCount - 1, trackIndex));
        }

        // Smart collision handling with push-through logic
        const rawScrubber = { ...scrubber, left: rawNewLeft, y: newTrack };
        
        // Find colliding scrubbers on the same track
        const collidingScrubbers = otherScrubbers.filter(other => {
          if (other.y !== newTrack) return false;
          const otherStart = other.left;
          const otherEnd = other.left + other.width;
          const newStart = rawNewLeft;
          const newEnd = rawNewLeft + scrubber.width;
          return !(newEnd <= otherStart || newStart >= otherEnd);
        });

        if (collidingScrubbers.length === 0) {
          // No collision - try snapping to nearby edges
          const snappedLeft = findSnapPoint(rawNewLeft, scrubber.id);
          const snappedScrubber = { ...scrubber, left: snappedLeft, y: newTrack };
          
          // Double-check snapped position doesn't cause collision
          if (!checkCollisionWithTrack(snappedScrubber, scrubber.id)) {
            onUpdate(snappedScrubber);
          } else {
            onUpdate(rawScrubber);
          }
        } else {
          // Collision detected - try smart positioning
          const collidingScrubber = collidingScrubbers[0]; // Handle first collision
          const collidingStart = collidingScrubber.left;
          const collidingEnd = collidingScrubber.left + collidingScrubber.width;
          
          // Determine which side of the colliding scrubber the mouse is closest to
          const mouseCenter = rawNewLeft + scrubber.width / 2;
          const collidingCenter = collidingStart + collidingScrubber.width / 2;
          
          let snapToLeft: number;
          let snapToRight: number;
          
          if (mouseCenter < collidingCenter) {
            // Mouse is on the left side - try snapping to left edge first
            snapToLeft = collidingStart - scrubber.width;
            snapToRight = collidingEnd;
          } else {
            // Mouse is on the right side - try snapping to right edge first
            snapToRight = collidingEnd;
            snapToLeft = collidingStart - scrubber.width;
          }
          
          // Try the preferred side first
          const preferredScrubber = mouseCenter < collidingCenter 
            ? { ...scrubber, left: Math.max(0, snapToLeft), y: newTrack }
            : { ...scrubber, left: Math.min(snapToRight, timelineWidth - scrubber.width), y: newTrack };
            
          if (!checkCollisionWithTrack(preferredScrubber, scrubber.id)) {
            onUpdate(preferredScrubber);
          } else {
            // Try the other side
            const alternateScrubber = mouseCenter < collidingCenter
              ? { ...scrubber, left: Math.min(snapToRight, timelineWidth - scrubber.width), y: newTrack }
              : { ...scrubber, left: Math.max(0, snapToLeft), y: newTrack };
              
            if (!checkCollisionWithTrack(alternateScrubber, scrubber.id)) {
              onUpdate(alternateScrubber);
            }
            // If both sides are blocked, don't update (scrubber stops)
          }
        }

        // Auto-scroll when dragging near edges
        if (containerRef.current) {
          const scrollSpeed = 10;
          const scrollThreshold = 100;
          const containerRect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX;

          if (mouseX < containerRect.left + scrollThreshold) {
            containerRef.current.scrollLeft -= scrollSpeed;
          } else if (mouseX > containerRect.right - scrollThreshold) {
            containerRef.current.scrollLeft += scrollSpeed;
            expandTimeline();
          }
        }
      } else if (isResizing) {
        const deltaX = e.clientX - dragStateRef.current.startX;

        if (resizeMode === "left") {
          let newLeft = dragStateRef.current.startLeft + deltaX;
          let newWidth = dragStateRef.current.startWidth - deltaX;

          if (scrubber.width === MINIMUM_WIDTH && deltaX > 0) {
            return;
          }

          newLeft = Math.max(0, newLeft);
          newWidth = Math.max(MINIMUM_WIDTH, newWidth);

          // Apply snapping to left edge
          newLeft = findSnapPoint(newLeft, scrubber.id);
          newWidth =
            dragStateRef.current.startLeft +
            dragStateRef.current.startWidth -
            newLeft;

          if (newLeft === 0) {
            newWidth =
              dragStateRef.current.startLeft +
              dragStateRef.current.startWidth;
          }

          if (newLeft + newWidth > timelineWidth) {
            newWidth = timelineWidth - newLeft;
          }

          const newScrubber = { ...scrubber, left: newLeft, width: newWidth };

          if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
            onUpdate(newScrubber);
          }
        } else if (resizeMode === "right") {
          let newWidth = dragStateRef.current.startWidth + deltaX;

          newWidth = Math.max(MINIMUM_WIDTH, newWidth);

          // Apply snapping to right edge
          const rightEdge = dragStateRef.current.startLeft + newWidth;
          const snappedRightEdge = findSnapPoint(rightEdge, scrubber.id);
          newWidth = snappedRightEdge - dragStateRef.current.startLeft;

          if (dragStateRef.current.startLeft + newWidth > timelineWidth) {
            if (expandTimeline()) {
              // Recalculate after expansion
              const rightEdge =
                dragStateRef.current.startLeft +
                dragStateRef.current.startWidth +
                deltaX;
              const snappedRightEdge = findSnapPoint(rightEdge, scrubber.id);
              newWidth = snappedRightEdge - dragStateRef.current.startLeft;
            } else {
              newWidth = timelineWidth - dragStateRef.current.startLeft;
            }
          }

          const newScrubber = { ...scrubber, width: newWidth };

          if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
            onUpdate(newScrubber);
          }
        }
      }
    },
    [
      isDragging,
      isResizing,
      resizeMode,
      scrubber, // Make sure scrubber is in dependencies to get fresh reference
      timelineWidth,
      checkCollisionWithTrack,
      onUpdate,
      expandTimeline,
      containerRef,
      findSnapPoint,
      trackCount,
      otherScrubbers,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeMode(null);
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle deletion with Delete/Backspace keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected) {
        // Prevent default behavior and check if we're not in an input field
        const target = e.target as HTMLElement;
        const isInputElement =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.isContentEditable;

        if (!isInputElement) {
          if ((e.key === "Delete" || e.key === "Backspace") && onDelete) {
            e.preventDefault();
            onDelete(scrubber.id);
          } else if (e.key === "m" || e.key === "M") {
            // Toggle mute for audio/video scrubbers with 'M' key
            if (scrubber.mediaType === "video" || scrubber.mediaType === "audio") {
              e.preventDefault();
              const updatedScrubber: ScrubberState = {
                ...scrubber,
                muted: !scrubber.muted,
              };
              onUpdate(updatedScrubber);
            }
          }
        }
      }
    };

    if (isSelected) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isSelected, onDelete, scrubber, onUpdate]);

  // Professional scrubber colors based on media type
  const getScrubberColor = () => {
    const baseColors = {
      video: "bg-primary border-primary/60 text-primary-foreground",
      image: "bg-green-600 border-green-500 text-white",
      text: "bg-purple-600 border-purple-500 text-white",
      default: "bg-primary border-primary/60 text-primary-foreground",
      audio: "bg-blue-600 border-blue-400 text-white",
    };

    const selectedColors = {
      video:
        "bg-primary border-primary text-primary-foreground ring-2 ring-primary/50",
      image:
        "bg-green-600 border-green-400 text-white ring-2 ring-green-400/50",
      text: "bg-purple-600 border-purple-400 text-white ring-2 ring-purple-400/50",
      audio:
        "bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/50",
      default:
        "bg-primary border-primary text-primary-foreground ring-2 ring-primary/50",
    };

    const colorSet = isSelected ? selectedColors : baseColors;
    return colorSet[scrubber.mediaType] || colorSet.default;
  };

  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the scrubber when right-clicked
    if (onSelect) {
      onSelect(scrubber.id);
    }
    
    // Get the position relative to the viewport
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  }, [onSelect, scrubber.id]);

  // Close context menu when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0 });
    }
  }, [contextMenu.visible]);

  // Handle context menu delete action
  const handleContextMenuDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onDelete) {
      onDelete(scrubber.id);
    }
    
    // Close context menu
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [onDelete, scrubber.id]);

  // Handle context menu edit text action
  const handleContextMenuEditText = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsEditingText(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // Handle context menu mute toggle action
  const handleContextMenuMuteToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const updatedScrubber: ScrubberState = {
      ...scrubber,
      muted: !scrubber.muted,
    };
    onUpdate(updatedScrubber);
    
    // Close context menu
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, [scrubber, onUpdate]);

  // Handle context menu volume settings action
  const handleContextMenuVolumeSettings = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsEditingVolume(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
  }, []);

  // Handle text properties save
  const handleTextPropertiesSave = useCallback((updatedTextProperties: import("./types").TextProperties) => {
    const updatedScrubber: ScrubberState = {
      ...scrubber,
      text: updatedTextProperties,
    };
    onUpdate(updatedScrubber);
  }, [scrubber, onUpdate]);

  // Add click outside listener for context menu
  useEffect(() => {
    if (contextMenu.visible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
      
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("contextmenu", handleClickOutside);
      };
    }
  }, [contextMenu.visible, handleClickOutside]);

  return (
    <>
      <div
        className={`group absolute rounded-sm cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md transition-all ${getScrubberColor()} select-none`}
        style={{
          left: `${scrubber.left}px`,
          width: `${scrubber.width}px`,
          top: `${(scrubber.y || 0) * DEFAULT_TRACK_HEIGHT + 2}px`,
          height: `${DEFAULT_TRACK_HEIGHT - 4}px`,
          minWidth: "20px",
          zIndex: isDragging || isResizing ? 1000 : isSelected ? 100 : 50,
        }}
        onMouseDown={(e) => handleMouseDown(e, "drag")}
        onContextMenu={handleContextMenu}
      >
        {/* Media type indicator - positioned after left resize handle */}
        <div className="absolute top-0.5 left-3 text-xs font-medium opacity-80 pointer-events-none">
          {scrubber.mediaType === "video" && "V"}
          {scrubber.mediaType === "image" && "I"}
          {scrubber.mediaType === "text" && "T"}
          {scrubber.mediaType === "audio" && "A"}
        </div>

        {/* Media name */}
        <div className="absolute top-0.5 left-6 right-6 text-xs truncate opacity-90 pointer-events-none">
          {scrubber.name}
        </div>

        {/* Mute indicator for audio/video */}
        {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && scrubber.muted && (
          <div className="absolute top-0.5 right-2 text-xs opacity-80 pointer-events-none">
            <VolumeX className="h-3 w-3" />
          </div>
        )}

        {/* Left resize handle - more visible */}
        {scrubber.mediaType !== "video" && scrubber.mediaType !== "audio" && (
          <div
            className="absolute top-0 left-0 h-full w-2 cursor-ew-resize z-20 hover:bg-white/30 transition-colors border-r border-white/20 group-hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-left")}
            title="Resize left edge"
          />
        )}

        {/* Right resize handle - more visible */}
        {scrubber.mediaType !== "video" && scrubber.mediaType !== "audio" && (
          <div
            className="absolute top-0 right-0 h-full w-2 cursor-ew-resize z-20 hover:bg-white/30 transition-colors border-l border-white/20 group-hover:bg-white/10"
            onMouseDown={(e) => handleMouseDown(e, "resize-right")}
            title="Resize right edge"
          />
        )}

        {/* Selection indicator - theme-appropriate glow effect */}
        {isSelected && (
          <div className="absolute -inset-0.5 rounded-sm pointer-events-none shadow-md shadow-primary/30 ring-1 ring-primary/60" />
        )}

        {/* Name and position tooltip when dragging - positioned above or below based on track */}
        {isDragging && (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-sm pointer-events-none border border-border shadow-md z-50 whitespace-nowrap ${
              (scrubber.y || 0) === 0 ? "top-full mt-1" : "-top-8"
            }`}
          >
            {scrubber.name} • {(scrubber.left / pixelsPerSecond).toFixed(2)}s -{" "}
            {((scrubber.left + scrubber.width) / pixelsPerSecond).toFixed(2)}s
          </div>
        )}

        {/* Resize tooltips when resizing - showing precise timestamps with dynamic positioning */}
        {isResizing && (
          <div
            className={`absolute left-1/2 transform -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-sm pointer-events-none border border-border shadow-md z-50 whitespace-nowrap ${
              (scrubber.y || 0) === 0 ? "top-full mt-1" : "-top-8"
            }`}
          >
            {resizeMode === "left"
              ? `Start: ${(scrubber.left / pixelsPerSecond).toFixed(2)}s`
              : `End: ${(
                  (scrubber.left + scrubber.width) /
                  pixelsPerSecond
                ).toFixed(2)}s`}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-popover text-popover-foreground border border-border rounded-md shadow-lg py-1 z-[9999]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {/* Show Edit Text option only for text scrubbers */}
          {scrubber.mediaType === "text" && scrubber.text && (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              onClick={handleContextMenuEditText}
            >
              <Edit className="h-3 w-3" />
              Edit Text
            </button>
          )}
          
          {/* Show Mute/Unmute option for video and audio scrubbers */}
          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              onClick={handleContextMenuMuteToggle}
            >
              {scrubber.muted ? (
                <>
                  <Volume2 className="h-3 w-3" />
                  Unmute
                </>
              ) : (
                <>
                  <VolumeX className="h-3 w-3" />
                  Mute
                </>
              )}
            </button>
          )}
          
          {/* Show Volume Settings option for video and audio scrubbers */}
          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
              onClick={handleContextMenuVolumeSettings}
            >
              <Settings className="h-3 w-3" />
              Volume Settings
            </button>
          )}
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-muted transition-colors text-left text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            onClick={handleContextMenuDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}

      {/* Text Properties Editor Modal */}
      {isEditingText && scrubber.mediaType === "text" && scrubber.text && (
        <TextPropertiesEditor
          textProperties={scrubber.text}
          isOpen={isEditingText}
          onClose={() => setIsEditingText(false)}
          onSave={handleTextPropertiesSave}
          scrubberId={scrubber.id}
        />
      )}

      {/* Volume Control Modal */}
      {isEditingVolume && (scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
        <VolumeControl
          scrubber={scrubber}
          isOpen={isEditingVolume}
          onClose={() => setIsEditingVolume(false)}
          onSave={onUpdate}
          scrubberId={scrubber.id}
        />
      )}
    </>
  );
};
