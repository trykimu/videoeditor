import React, { useState, useRef, useCallback, useEffect } from "react"
import { DEFAULT_TRACK_HEIGHT, type ScrubberState } from "./types"

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
  containerRef: React.RefObject<HTMLDivElement | null>;
  expandTimeline: () => boolean;
  snapConfig: SnapConfig;
  trackCount: number;
}

export const Scrubber: React.FC<ScrubberProps> = ({
  scrubber,
  timelineWidth,
  otherScrubbers,
  onUpdate,
  containerRef,
  expandTimeline,
  snapConfig,
  trackCount,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeMode, setResizeMode] = useState<"left" | "right" | null>(null)
  const dragStateRef = useRef({
    offsetX: 0,
    startX: 0,
    startLeft: 0,
    startWidth: 0,
  })

  const MINIMUM_WIDTH = 20

  // Get snap points (scrubber edges and grid marks)
  const getSnapPoints = useCallback((excludeId?: string) => {
    const snapPoints: number[] = []

    // Add grid marks every 100 pixels (like seconds)
    for (let pos = 0; pos <= timelineWidth; pos += 100) {
      snapPoints.push(pos)
    }

    // Add scrubber edges
    otherScrubbers.forEach(other => {
      if (other.id !== excludeId) {
        snapPoints.push(other.left)
        snapPoints.push(other.left + other.width)
      }
    })

    return snapPoints
  }, [otherScrubbers, timelineWidth])

  // Find nearest snap point
  const findSnapPoint = useCallback((position: number, excludeId?: string): number => {
    if (!snapConfig.enabled) return position

    const snapPoints = getSnapPoints(excludeId)

    for (const snapPos of snapPoints) {
      if (Math.abs(position - snapPos) < snapConfig.distance) {
        return snapPos
      }
    }

    return position
  }, [snapConfig, getSnapPoints])

  // Check collision with track awareness
  const checkCollisionWithTrack = useCallback(
    (newScrubber: ScrubberState, excludeId?: string) => {
      return otherScrubbers.some(other => {
        if (other.id === excludeId || other.y !== newScrubber.y) return false

        const otherStart = other.left
        const otherEnd = other.left + other.width
        const newStart = newScrubber.left
        const newEnd = newScrubber.left + newScrubber.width

        return !(newEnd <= otherStart || newStart >= otherEnd)
      })
    },
    [otherScrubbers]
  )

  const getScrubberBounds = useCallback((scrubber: ScrubberState) => {
    const scrollLeft = containerRef.current?.scrollLeft || 0
    return {
      left: scrubber.left + scrollLeft,
      right: scrubber.left + scrubber.width + scrollLeft,
    }
  }, [containerRef])

  const checkCollision = useCallback(
    (scrubber1: ScrubberState, scrubber2: ScrubberState) => {
      const bounds1 = getScrubberBounds(scrubber1)
      const bounds2 = getScrubberBounds(scrubber2)
      return !(bounds1.right <= bounds2.left || bounds1.left >= bounds2.right)
    },
    [getScrubberBounds],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: "drag" | "resize-left" | "resize-right") => {
      e.preventDefault()
      e.stopPropagation()

      if (mode === "drag") {
        setIsDragging(true)
        dragStateRef.current.offsetX = e.clientX - scrubber.left
      } else {
        setIsResizing(true)
        setResizeMode(mode === "resize-left" ? "left" : "right")
        dragStateRef.current.startX = e.clientX
        dragStateRef.current.startLeft = scrubber.left
        dragStateRef.current.startWidth = scrubber.width
      }
    },
    [scrubber],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return

      if (isDragging) {
        let newLeft = e.clientX - dragStateRef.current.offsetX
        const min = 0
        const max = timelineWidth - scrubber.width
        newLeft = Math.max(min, Math.min(max, newLeft))

        // Apply snapping
        newLeft = findSnapPoint(newLeft, scrubber.id)

        // Calculate track changes based on mouse Y position
        let newTrack = scrubber.y || 0
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          const mouseY = e.clientY - containerRect.top
          const trackIndex = Math.floor(mouseY / DEFAULT_TRACK_HEIGHT)
          newTrack = Math.max(0, Math.min(trackCount - 1, trackIndex))
        }

        const newScrubber = { ...scrubber, left: newLeft, y: newTrack }

        // Use track-aware collision detection
        if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
          onUpdate(newScrubber)
        }

        // Auto-scroll when dragging near edges
        if (containerRef.current) {
          const scrollSpeed = 10
          const scrollThreshold = 100
          const containerRect = containerRef.current.getBoundingClientRect()
          const mouseX = e.clientX

          if (mouseX < containerRect.left + scrollThreshold) {
            containerRef.current.scrollLeft -= scrollSpeed
          } else if (mouseX > containerRect.right - scrollThreshold) {
            containerRef.current.scrollLeft += scrollSpeed
            expandTimeline()
          }
        }
      } else if (isResizing) {
        const deltaX = e.clientX - dragStateRef.current.startX

        if (resizeMode === "left") {
          let newLeft = dragStateRef.current.startLeft + deltaX
          let newWidth = dragStateRef.current.startWidth - deltaX

          if (scrubber.width === MINIMUM_WIDTH && deltaX > 0) {
            return
          }

          newLeft = Math.max(0, newLeft)
          newWidth = Math.max(MINIMUM_WIDTH, newWidth)

          // Apply snapping to left edge
          newLeft = findSnapPoint(newLeft, scrubber.id)
          newWidth = dragStateRef.current.startLeft + dragStateRef.current.startWidth - newLeft

          if (newLeft === 0) {
            newWidth = dragStateRef.current.startLeft + dragStateRef.current.startWidth
          }

          if (newLeft + newWidth > timelineWidth) {
            newWidth = timelineWidth - newLeft
          }

          const newScrubber = { ...scrubber, left: newLeft, width: newWidth }

          if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
            onUpdate(newScrubber)
          }
        } else if (resizeMode === "right") {
          let newWidth = dragStateRef.current.startWidth + deltaX

          newWidth = Math.max(MINIMUM_WIDTH, newWidth)

          // Apply snapping to right edge
          const rightEdge = dragStateRef.current.startLeft + newWidth
          const snappedRightEdge = findSnapPoint(rightEdge, scrubber.id)
          newWidth = snappedRightEdge - dragStateRef.current.startLeft

          if (dragStateRef.current.startLeft + newWidth > timelineWidth) {
            if (expandTimeline()) {
              // Recalculate after expansion
              const rightEdge = dragStateRef.current.startLeft + dragStateRef.current.startWidth + deltaX
              const snappedRightEdge = findSnapPoint(rightEdge, scrubber.id)
              newWidth = snappedRightEdge - dragStateRef.current.startLeft
            } else {
              newWidth = timelineWidth - dragStateRef.current.startLeft
            }
          }

          const newScrubber = { ...scrubber, width: newWidth }

          if (!checkCollisionWithTrack(newScrubber, scrubber.id)) {
            onUpdate(newScrubber)
          }
        }
      }
    },
    [isDragging, isResizing, resizeMode, scrubber, timelineWidth, checkCollisionWithTrack, onUpdate, expandTimeline, containerRef, findSnapPoint, trackCount],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeMode(null)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  // Uniform scrubber color for professional look
  const getScrubberColor = () => {
    return "bg-blue-600 border-blue-500"; // Premiere-style blue scrubbers
  }

  return (
    <div
      className={`absolute rounded cursor-grab active:cursor-grabbing border shadow-sm hover:shadow-md transition-shadow ${getScrubberColor()} select-none`}
      style={{
        left: `${scrubber.left}px`,
        width: `${scrubber.width}px`,
        top: `${(scrubber.y || 0) * DEFAULT_TRACK_HEIGHT}px`,
        height: `${DEFAULT_TRACK_HEIGHT}px`,
        minWidth: "20px",
        zIndex: isDragging ? 1000 : 10,
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Remove emoji indicator for cleaner look */}

      {/* Left resize handle */}
      <div
        className="absolute top-0 left-0 h-full w-1 cursor-ew-resize z-10 hover:bg-white/10 rounded-l transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "resize-left")}
      />

      {/* Right resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-1 cursor-ew-resize z-10 hover:bg-white/10 rounded-r transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "resize-right")}
      />

      {/* Track indicator tooltip when dragging */}
      {isDragging && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded pointer-events-none border border-gray-600">
          Track {(scrubber.y || 0) + 1}
        </div>
      )}
    </div>
  )
} 