import React, { useState, useRef, useCallback, useEffect } from "react";
import { DEFAULT_TRACK_HEIGHT, type ScrubberState } from "./types";

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
  const lastUpdateTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const MINIMUM_WIDTH = 20;
  const UPDATE_THROTTLE = 16; // ~60fps

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

  // Check collision with track awareness
  const checkCollisionWithTrack = useCallback(
    (newScrubber: ScrubberState, excludeId?: string) => {
      return otherScrubbers.some((other) => {
        if (other.id === excludeId || other.y !== newScrubber.y) return false;

        const otherStart = other.left;
        const otherEnd = other.left + other.width;
        const newStart = newScrubber.left;
        const newEnd = newScrubber.left + newScrubber.width;

        return !(newEnd <= otherStart || newStart >= otherEnd);
      });
    },
    [otherScrubbers]
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

      // Throttle updates using requestAnimationFrame
      const now = performance.now();
      if (now - lastUpdateTimeRef.current < UPDATE_THROTTLE) {
        return;
      }
      lastUpdateTimeRef.current = now;

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (isDragging) {
          let newLeft = e.clientX - dragStateRef.current.offsetX;
          const min = 0;
          const max = timelineWidth - scrubber.width;
          newLeft = Math.max(min, Math.min(max, newLeft));

          // Apply snapping
          newLeft = findSnapPoint(newLeft, scrubber.id);

          // Calculate track changes based on mouse Y position
          let newTrack = scrubber.y || 0;
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const mouseY = e.clientY - containerRect.top;
            const trackIndex = Math.floor(mouseY / DEFAULT_TRACK_HEIGHT);
            newTrack = Math.max(0, Math.min(trackCount - 1, trackIndex));
          }

          const newScrubber = { ...scrubber, left: newLeft, y: newTrack };

          // Use track-aware collision detection
          if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
            onUpdate(newScrubber);
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
      });
    },
    [
      isDragging,
      isResizing,
      resizeMode,
      scrubber,
      timelineWidth,
      checkCollisionWithTrack,
      onUpdate,
      expandTimeline,
      containerRef,
      findSnapPoint,
      trackCount,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeMode(null);

    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      // Cancel any pending animation frame on cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle deletion with Delete/Backspace keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === "Delete" || e.key === "Backspace")) {
        // Prevent default behavior and check if we're not in an input field
        const target = e.target as HTMLElement;
        const isInputElement =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.isContentEditable;

        if (!isInputElement && onDelete) {
          e.preventDefault();
          onDelete(scrubber.id);
        }
      }
    };

    if (isSelected) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isSelected, onDelete, scrubber.id]);

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

  return (
    <div
      className={`group absolute rounded-sm cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md transition-all ${getScrubberColor()} select-none`}
      style={{
        left: `${scrubber.left}px`,
        width: `${scrubber.width}px`,
        top: `${(scrubber.y || 0) * DEFAULT_TRACK_HEIGHT + 2}px`,
        height: `${DEFAULT_TRACK_HEIGHT - 4}px`,
        minWidth: "20px",
        zIndex: isDragging || isResizing ? 1000 : isSelected ? 20 : 15,
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
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
  );
};
