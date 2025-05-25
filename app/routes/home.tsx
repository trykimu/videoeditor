import React, { useState, useRef, useCallback, useEffect } from "react"
import { VideoPlayer } from "~/remotion/VideoPlayer"

interface ScrubberState {
  id: string
  left: number
  width: number
}

interface TimelineState {
  id: string
  scrubbers: ScrubberState[]
}

interface ScrubberProps {
  scrubber: ScrubberState
  timelineWidth: number
  otherScrubbers: ScrubberState[]
  onUpdate: (updatedScrubber: ScrubberState) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  expandTimeline: () => boolean
}

const Scrubber: React.FC<ScrubberProps> = ({
  scrubber,
  timelineWidth,
  otherScrubbers,
  onUpdate,
  containerRef,
  expandTimeline,
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

        const newScrubber = { ...scrubber, left: newLeft }

        if (!otherScrubbers.some((other) => checkCollision(newScrubber, other))) {
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

          if (newLeft === 0) {
            newWidth = dragStateRef.current.startLeft + dragStateRef.current.startWidth
          }

          if (newLeft + newWidth > timelineWidth) {
            newWidth = timelineWidth - newLeft
          }

          const newScrubber = { ...scrubber, left: newLeft, width: newWidth }

          if (!otherScrubbers.some((other) => checkCollision(newScrubber, other))) {
            onUpdate(newScrubber)
          }
        } else if (resizeMode === "right") {
          let newWidth = dragStateRef.current.startWidth + deltaX

          newWidth = Math.max(MINIMUM_WIDTH, newWidth)

          if (dragStateRef.current.startLeft + newWidth > timelineWidth) {
            if (expandTimeline()) {
              newWidth = dragStateRef.current.startWidth + deltaX
            } else {
              newWidth = timelineWidth - dragStateRef.current.startLeft
            }
          }

          const newScrubber = { ...scrubber, width: newWidth }

          if (!otherScrubbers.some((other) => checkCollision(newScrubber, other))) {
            onUpdate(newScrubber)
          }
        }
      }
    },
    [isDragging, isResizing, resizeMode, scrubber, timelineWidth, otherScrubbers, checkCollision, onUpdate, expandTimeline, containerRef],
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

  return (
    <div
      className="absolute top-0 bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing border border-blue-600"
      style={{
        left: `${scrubber.left}px`,
        width: `${scrubber.width}px`,
        height: "100%",
        minWidth: "20px",
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      <div
        className="absolute top-0 left-0 h-full w-2 cursor-ew-resize z-10 hover:bg-white/30 rounded-l-lg"
        onMouseDown={(e) => handleMouseDown(e, "resize-left")}
      />
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize z-10 hover:bg-white/30 rounded-r-lg"
        onMouseDown={(e) => handleMouseDown(e, "resize-right")}
      />
    </div>
  )
}

interface TimelineProps {
  timeline: TimelineState
  onUpdate: (updatedTimeline: TimelineState) => void
  onDelete: () => void
  timelineWidth: number
  containerRef: React.RefObject<HTMLDivElement | null>
  expandTimeline: () => boolean
}

const Timeline: React.FC<TimelineProps> = ({ 
  timeline, 
  onUpdate, 
  onDelete, 
  timelineWidth,
  containerRef,
  expandTimeline 
}) => {
  const timelineRef = useRef<HTMLDivElement>(null)

  const handleAddScrubber = useCallback(() => {
    const newScrubber: ScrubberState = {
      id: crypto.randomUUID(),
      left: 50,
      width: 80,
    }
    onUpdate({
      ...timeline,
      scrubbers: [...timeline.scrubbers, newScrubber],
    })
  }, [timeline, onUpdate])

  const handleUpdateScrubber = useCallback(
    (updatedScrubber: ScrubberState) => {
      onUpdate({
        ...timeline,
        scrubbers: timeline.scrubbers.map((s) => (s.id === updatedScrubber.id ? updatedScrubber : s)),
      })
    },
    [timeline, onUpdate],
  )

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Timeline {timeline.id}</h3>
        <div className="space-x-2">
          <button
            onClick={handleAddScrubber}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Scrubber
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Timeline
          </button>
        </div>
      </div>
      <div ref={timelineRef} className="h-16 bg-gray-200 relative rounded-lg" style={{ width: `${timelineWidth}px` }}>
        {timeline.scrubbers.map((scrubber) => (
          <Scrubber
            key={scrubber.id}
            scrubber={scrubber}
            timelineWidth={timelineWidth}
            otherScrubbers={timeline.scrubbers.filter((s) => s.id !== scrubber.id)}
            onUpdate={handleUpdateScrubber}
            containerRef={containerRef}
            expandTimeline={expandTimeline}
          />
        ))}
      </div>
    </div>
  )
}

export default function TimelineEditor() {
  const [timelines, setTimelines] = useState<TimelineState[]>([
    {
      id: "1",
      scrubbers: [
        { id: "1-1", left: 50, width: 80 },
      ],
    },
  ])
  const [timelineWidth, setTimelineWidth] = useState(2000)
  const containerRef = useRef<HTMLDivElement>(null)

  const EXPANSION_THRESHOLD = 200
  const EXPANSION_AMOUNT = 1000

  const getTimelineData = useCallback(() => {
    // Assuming 100 pixels = 1 second for conversion
    const PIXELS_PER_SECOND = 100;
    
    const timelineData = timelines.map(timeline => ({
      id: timeline.id,
      totalDuration: timelineWidth / PIXELS_PER_SECOND,
      scrubbers: timeline.scrubbers.map(scrubber => ({
        id: scrubber.id,
        startTime: scrubber.left / PIXELS_PER_SECOND,
        endTime: (scrubber.left + scrubber.width) / PIXELS_PER_SECOND,
        duration: scrubber.width / PIXELS_PER_SECOND
      }))
    }))

    return timelineData
  }, [timelines, timelineWidth])

  const expandTimeline = useCallback(() => {
    if (!containerRef.current) return false

    const containerWidth = containerRef.current.offsetWidth
    const currentScrollLeft = containerRef.current.scrollLeft
    const scrollRight = currentScrollLeft + containerWidth
    const distanceToEnd = timelineWidth - scrollRight

    if (distanceToEnd < EXPANSION_THRESHOLD) {
      setTimelineWidth((prev) => prev + EXPANSION_AMOUNT)
      return true
    }
    return false
  }, [timelineWidth])

  const handleScroll = useCallback(() => {
    expandTimeline()
  }, [expandTimeline])

  const handleAddTimeline = useCallback(() => {
    const newTimeline: TimelineState = {
      id: crypto.randomUUID(),
      scrubbers: [],
    }
    setTimelines((prev) => [...prev, newTimeline])
  }, [])

  const handleUpdateTimeline = useCallback((updatedTimeline: TimelineState) => {
    setTimelines((prev) => prev.map((t) => (t.id === updatedTimeline.id ? updatedTimeline : t)))
  }, [])

  const handleDeleteTimeline = useCallback((timelineId: string) => {
    setTimelines((prev) => prev.filter((t) => t.id !== timelineId))
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto mt-24 p-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Timeline Editor</h2>
        <div className="space-x-2">
          <button
            onClick={getTimelineData}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Log Timeline Data
          </button>
          <button
            onClick={handleAddTimeline}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Timeline
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 scrollbar-track-rounded scrollbar-thumb-rounded"
        onScroll={handleScroll}
      >
        {timelines.map((timeline) => (
          <Timeline
            key={timeline.id}
            timeline={timeline}
            onUpdate={handleUpdateTimeline}
            onDelete={() => handleDeleteTimeline(timeline.id)}
            timelineWidth={timelineWidth}
            containerRef={containerRef}
            expandTimeline={expandTimeline}
          />
        ))}
      </div>

      {/* Video Preview Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Video Preview</h2>
        <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <VideoPlayer timelineData={getTimelineData()} />
        </div>
      </div>
    </div>
  )
}
