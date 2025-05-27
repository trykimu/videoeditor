import React, { useState, useRef, useCallback, useEffect } from "react"
import { VideoPlayer as RemotionVideoPlayer } from "~/remotion/VideoPlayer"
import {parseMedia} from '@remotion/media-parser';
import axios from "axios"
import type { PlayerRef } from "@remotion/player";

// Constants
const PIXELS_PER_SECOND = 100;
const DEFAULT_TRACK_HEIGHT = 60; // Added constant for track height
const FPS = 30; // Added constant for FPS

interface ScrubberState {
  id: string
  left: number // in pixels
  width: number // in pixels
  mediaType: "video" | "image" | "text"
  mediaUrlLocal?: string
  mediaUrlRemote?: string
  y?: number // track position (0-based index)
  name?: string // Added for displaying a name
  durationInSeconds?: number // Added for original video duration
}

interface MediaBinItem {
  id: string;
  mediaType: "video" | "image" | "text";
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  name: string; 
  durationInSeconds?: number; // For videos, to calculate initial width
}

// New specific types for timelineData
interface TimelineScrubberItem {
  id: string;
  mediaType: "video" | "image" | "text";
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  width: number; 
  startTime: number; 
  endTime: number; 
  duration: number; 
  trackId: string;
  trackIndex: number;
  name?: string;
}

interface TimelineDataItem {
  id: string;
  totalDuration: number; 
  scrubbers: TimelineScrubberItem[];
}

interface TrackState {
  id: string
  scrubbers: ScrubberState[]
}

interface TimelineState {
  id: string
  tracks: TrackState[]
}

// Add snapping configuration
interface SnapConfig {
  enabled: boolean
  distance: number // snap distance in pixels
}

interface ScrubberProps {
  scrubber: ScrubberState
  timelineWidth: number
  otherScrubbers: ScrubberState[]
  onUpdate: (updatedScrubber: ScrubberState) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  expandTimeline: () => boolean
  snapConfig: SnapConfig
  trackCount: number
  // trackHeight: number // trackHeight will now be a constant
}

const Scrubber: React.FC<ScrubberProps> = ({
  scrubber,
  timelineWidth,
  otherScrubbers,
  onUpdate,
  containerRef,
  expandTimeline,
  snapConfig,
  trackCount,
  // trackHeight, // Replaced with DEFAULT_TRACK_HEIGHT
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
    [isDragging, isResizing, resizeMode, scrubber, timelineWidth, checkCollisionWithTrack, onUpdate, expandTimeline, containerRef, findSnapPoint, trackCount /* removed trackHeight */],
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
      className="absolute bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing border border-blue-600 shadow-lg hover:shadow-xl transition-shadow"
      style={{
        left: `${scrubber.left}px`,
        width: `${scrubber.width}px`,
        top: `${(scrubber.y || 0) * DEFAULT_TRACK_HEIGHT}px`, // Use constant
        height: `${DEFAULT_TRACK_HEIGHT}px`, // Use constant
        minWidth: "20px",
        zIndex: isDragging ? 1000 : 10,
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
    >
      {/* Media type indicator */}
      <div className="absolute top-1 left-1 text-xs text-white/70 font-medium">
        {scrubber.mediaType === "video" ? "🎥" : scrubber.mediaType === "image" ? "🖼️" : "📝"}
      </div>
      
      {/* Left resize handle */}
      <div
        className="absolute top-0 left-0 h-full w-2 cursor-ew-resize z-10 hover:bg-white/30 rounded-l-lg transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "resize-left")}
      />
      
      {/* Right resize handle */}
      <div
        className="absolute top-0 right-0 h-full w-2 cursor-ew-resize z-10 hover:bg-white/30 rounded-r-lg transition-colors"
        onMouseDown={(e) => handleMouseDown(e, "resize-right")}
      />
      
      {/* Track indicator when dragging */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-1 rounded pointer-events-none">
          Track {(scrubber.y || 0) + 1}
        </div>
      )}
    </div>
  )
}

// If VideoPlayer is imported, its props should ideally come from its definition.
// For now, to resolve linting, we define a more comprehensive placeholder.
interface VideoPlayerProps {
    timelineData: TimelineDataItem[]; // Changed from any
    durationInFrames: number;
    currentFrame?: number; // Prop for syncing ruler with player
    // [key: string]: any; // Removed permissive index signature
}

const VideoPlayer = RemotionVideoPlayer as React.FC<VideoPlayerProps & { ref?: React.Ref<PlayerRef> }>;

export default function TimelineEditor() {
  const [timeline, setTimeline] = useState<TimelineState>({
    id: "main",
    tracks: [
      {
        id: "track-1",
        scrubbers: [
          { id: "1-1", left: 50, width: 80, mediaType: "text", y: 0, name: "Text Element" },
        ],
      },
      {
        id: "track-2", 
        scrubbers: [],
      },
    ],
  })
  const [timelineWidth, setTimelineWidth] = useState(2000)
  const [isRendering, setIsRendering] = useState(false)
  const [renderStatus, setRenderStatus] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);

  const [mediaBinItems, setMediaBinItems] = useState<MediaBinItem[]>([
    // Example item
    // { id: "mb-1", mediaType: "image", name: "Placeholder Image" } 
  ])
  const [rulerPositionPx, setRulerPositionPx] = useState(0) // In pixels

  const EXPANSION_THRESHOLD = 200
  const EXPANSION_AMOUNT = 1000

  const getTimelineData = useCallback(() => {
    // Assuming 100 pixels = 1 second for conversion
    // const PIXELS_PER_SECOND = 100; // Defined globally now
    
    const timelineData = [{
      id: timeline.id,
      totalDuration: timelineWidth / PIXELS_PER_SECOND,
      scrubbers: timeline.tracks.flatMap(track => 
        track.scrubbers.map(scrubber => ({
          id: scrubber.id,
          mediaType: scrubber.mediaType,
          mediaUrlLocal: scrubber.mediaUrlLocal,
          mediaUrlRemote: scrubber.mediaUrlRemote,
          width: scrubber.width,
          startTime: scrubber.left / PIXELS_PER_SECOND,
          endTime: (scrubber.left + scrubber.width) / PIXELS_PER_SECOND,
          duration: scrubber.width / PIXELS_PER_SECOND,
          trackId: track.id,
          trackIndex: scrubber.y || 0
        }))
      )
    }]

    return timelineData
  }, [timeline, timelineWidth])

  const handleRenderVideo = useCallback(async () => {
    setIsRendering(true)
    setRenderStatus("Starting render...")
    
    try {
      const timelineData = getTimelineData()
      
      if (timeline.tracks.length === 0 || timeline.tracks.every(t => t.scrubbers.length === 0)) {
        setRenderStatus("Error: No timeline data to render")
        setIsRendering(false)
        return
      }

      setRenderStatus("Sending data to render server...")
      
      const response = await axios.post('http://localhost:8000/render', {
        timelineData: timelineData,
        durationInFrames: (() => {
          const timelineData = getTimelineData();
          let maxEndTime = 0;
          
          timelineData.forEach(timelineItem => {
            timelineItem.scrubbers.forEach(scrubber => {
              if (scrubber.endTime > maxEndTime) {
                maxEndTime = scrubber.endTime;
              }
            });
          });
          console.log("Max end time:", maxEndTime*30);
          // Convert seconds to frames (assuming 30 FPS)
          return Math.ceil(maxEndTime * 30);
        })()
      }, {
        responseType: 'blob',
        timeout: 120000, // 2 minutes timeout
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setRenderStatus(`Downloading rendered video: ${percentCompleted}%`)
          } else {
            setRenderStatus("Rendering video...")
          }
        }
      })

      // Create download link for the rendered video
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'rendered-video.mp4')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setRenderStatus("Video rendered and downloaded successfully!")
      
    } catch (error) {
      console.error('Render error:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setRenderStatus("Error: Render timeout - try reducing video length")
        } else if (error.response?.status === 500) {
          setRenderStatus(`Error: ${error.response.data?.message || 'Server error during rendering'}`)
        } else if (error.request) {
          setRenderStatus("Error: Cannot connect to render server. Is it running on port 8000?")
        } else {
          setRenderStatus(`Error: ${error.message}`)
        }
      } else {
        setRenderStatus("Error: Unknown rendering error occurred")
      }
    } finally {
      setIsRendering(false)
      // Clear status after 5 seconds
      setTimeout(() => setRenderStatus(""), 5000)
    }
  }, [getTimelineData, timeline])

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

  const handleAddTrack = useCallback(() => {
    const newTrack: TrackState = {
      id: crypto.randomUUID(),
      scrubbers: [],
    }
    setTimeline((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
  }, [])

  const handleUpdateTrack = useCallback((trackId: string, updatedTrack: TrackState) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? updatedTrack : t))
    }))
  }, [])

  const handleDeleteTrack = useCallback((trackId: string) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== trackId)
    }))
  }, [])

  const getAllScrubbers = useCallback(() => {
    return timeline.tracks.flatMap(track => track.scrubbers)
  }, [timeline])

  const handleUpdateScrubber = useCallback((updatedScrubber: ScrubberState) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        scrubbers: track.scrubbers.map(scrubber => 
          scrubber.id === updatedScrubber.id ? updatedScrubber : scrubber
        )
      }))
    }))
  }, [])

  const handleAddScrubberToTrack = useCallback((trackId: string, newScrubber: ScrubberState) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId 
          ? { ...track, scrubbers: [...track.scrubbers, newScrubber] }
          : track
      )
    }))
  }, [])

  // New: Add Media to Bin
  const handleAddMediaToBin = useCallback(async (file: File) => {
    const id = crypto.randomUUID();
    const name = file.name;
    let mediaType: "video" | "image" = "image";
    if (file.type.startsWith("video/")) mediaType = "video";
    else if (file.type.startsWith("image/")) mediaType = "image";
    else {
      alert("Unsupported file type. Please select a video or image.");
      return;
    }

    console.log("Adding to bin:", name, mediaType);

    try {
      let durationInSeconds: number | undefined = undefined;
      const mediaUrlLocal = URL.createObjectURL(file);
      
      if (mediaType === "video") {
        console.log("Parsing video file for duration...");
        const parsedMedia = await parseMedia({
          src: file,
          fields: { durationInSeconds: true }
        });
        durationInSeconds = parsedMedia.durationInSeconds === null ? undefined : parsedMedia.durationInSeconds;
        console.log("Video duration:", durationInSeconds, "seconds");
      }

      // Upload file to server to get global URL
      const formData = new FormData();
      formData.append('media', file);
      
      console.log("Uploading file to server...");
      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }
      
      const uploadResult = await uploadResponse.json();
      console.log("Upload successful:", uploadResult);

      const newItem: MediaBinItem = {
        id,
        name,
        mediaType,
        mediaUrlLocal,
        mediaUrlRemote: uploadResult.fullUrl,
        durationInSeconds,
      };
      setMediaBinItems(prev => [...prev, newItem]);

    } catch (error) {
      console.error("Error adding media to bin:", error);
      alert(`Failed to add media: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, []);
  
  // New: Add Text to Bin
  const handleAddTextToBin = useCallback(() => {
    const newItem: MediaBinItem = {
      id: crypto.randomUUID(),
      name: "Text Element",
      mediaType: "text",
    };
    setMediaBinItems(prev => [...prev, newItem]);
  }, []);

  // New: Handle Ruler Drag (Simplified: sets position, player sync is TBD in VideoPlayer)
  const handleRulerDrag = (newPositionPx: number) => {
    const newFrame = Math.round((newPositionPx / PIXELS_PER_SECOND) * FPS);
    setRulerPositionPx(Math.max(0, Math.min(newPositionPx, timelineWidth)));
    playerRef.current?.seekTo(newFrame);
  };

  // Placeholder for dragging item from bin to timeline
  const handleDropOnTrack = (item: MediaBinItem, trackId: string, dropLeftPx: number) => {
    console.log("Dropped", item.name, "on track", trackId, "at", dropLeftPx, "px");
    
    let widthPx = item.mediaType === "text" ? 80 : 150; // Default width
    if (item.mediaType === "video" && item.durationInSeconds) {
      widthPx = item.durationInSeconds * PIXELS_PER_SECOND;
    } else if (item.mediaType === "image") {
      widthPx = 100; // Default for images
    }
    widthPx = Math.max(20, widthPx); // Ensure minimum width

    const targetTrackIndex = timeline.tracks.findIndex(t => t.id === trackId);
    if (targetTrackIndex === -1) return;

    const newScrubber: ScrubberState = {
      id: item.id, // Reuse ID or generate new? For now, reuse.
      left: dropLeftPx,
      width: widthPx,
      mediaType: item.mediaType,
      mediaUrlLocal: item.mediaUrlLocal,
      mediaUrlRemote: item.mediaUrlRemote,
      y: targetTrackIndex,
      name: item.name,
      durationInSeconds: item.durationInSeconds,
    };

    // Add to the specific track
    handleAddScrubberToTrack(trackId, newScrubber);
    
    // Remove from media bin
    setMediaBinItems(prev => prev.filter(mb => mb.id !== item.id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-12 p-4 flex flex-col space-y-4">
      {/* Top Section: Media Bin and Player */}
      <div className="flex space-x-4 h-[300px]"> {/* Approx height for player/bin */}
        {/* Top Left: Media Bin */}
        <div className="w-1/3 bg-gray-50 p-3 rounded-lg shadow border border-gray-200 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Media Bin</h3>
          <div className="space-y-2">
            {mediaBinItems.map(item => (
              <div 
                key={item.id} 
                // Make this draggable in a future step
                className="p-2 bg-blue-100 border border-blue-300 rounded shadow-sm cursor-grab"
                // Basic drag simulation for now to test drop
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", JSON.stringify(item));
                  console.log("Dragging item:", item.name);
                }}
              >
                {item.mediaType === "video" ? "🎥" : item.mediaType === "image" ? "🖼️" : "📝"} {item.name} 
                {item.durationInSeconds && ` (${item.durationInSeconds.toFixed(1)}s)`}
              </div>
            ))}
            {mediaBinItems.length === 0 && <p className="text-sm text-gray-500">Add media or text elements.</p>}
          </div>
        </div>

        {/* Top Right: Video Player */}
        <div className="w-2/3 bg-gray-900 rounded-lg overflow-hidden shadow">
          <VideoPlayer
            timelineData={getTimelineData()}
            durationInFrames={(() => {
              const currentTimelineData = getTimelineData();
              let maxEndTime = 0;
              currentTimelineData.forEach(timelineItem => {
                timelineItem.scrubbers.forEach(scrubber => {
                  if (scrubber.endTime > maxEndTime) maxEndTime = scrubber.endTime;
                });
              });
              return Math.ceil(maxEndTime * FPS); 
            })()}
            // This prop needs to be implemented/handled by VideoPlayer component
            currentFrame={Math.round((rulerPositionPx / PIXELS_PER_SECOND) * FPS)} 
            ref={playerRef}
          />
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex justify-between items-center py-4">
        <h2 className="text-2xl font-bold">Timeline</h2>
        <div className="space-x-2">
          <input 
            type="file" 
            accept="video/*,image/*"
            id="media-upload-input" 
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleAddMediaToBin(file);
                e.target.value = ""; // Reset file input
              }
            }}
          />
          <button
            onClick={() => document.getElementById('media-upload-input')?.click()}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            Add Media
          </button>
          <button
            onClick={handleAddTextToBin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Text
          </button>
          <button
            onClick={handleAddTrack}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Track
          </button>
          <button
            onClick={handleRenderVideo}
            disabled={isRendering}
            className={`px-4 py-2 text-white rounded transition-colors ${
              isRendering 
                ? "bg-gray-500 cursor-not-allowed" 
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isRendering ? "Rendering..." : "Render Video"}
          </button>
           <button
            onClick={() => console.log(getTimelineData())}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Log Timeline Data
          </button>
        </div>
      </div>
      
      {/* Render Status */}
      {renderStatus && (
        <div className={`mb-4 p-3 rounded-lg ${
          renderStatus.startsWith("Error") 
            ? "bg-red-100 text-red-700 border border-red-200" 
            : renderStatus.includes("successfully")
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-blue-100 text-blue-700 border border-blue-200"
        }`}>
          {renderStatus}
        </div>
      )}

      {/* Bottom Section: Timeline */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 scrollbar-track-rounded scrollbar-thumb-rounded"
        onScroll={handleScroll}
      >
        {/* Timeline Ruler (Simplified visual) */}
        <div 
            className="h-12 bg-gray-200 relative border-b-2 border-gray-400 cursor-pointer"
            style={{ width: `${timelineWidth}px` }}
            onClick={(e) => { 
                if (containerRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newPositionPx = clickX + (containerRef.current.scrollLeft || 0);
                    handleRulerDrag(newPositionPx);
                }
            }}
        >
            {/* Ruler line indicator */}
            <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                style={{ left: `${rulerPositionPx}px`}}
            >
                <div className="absolute -top-2.5 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm pointer-events-none">
                    {(rulerPositionPx / PIXELS_PER_SECOND).toFixed(1)}s
                </div>
            </div>
            {/* Ruler markings */}
            {Array.from({ length: Math.floor(timelineWidth / PIXELS_PER_SECOND) + 1 }, (_, index) => index).map((sec) => (
                <div key={`ruler-mark-${sec}`} className="absolute top-0 h-full flex flex-col justify-end pointer-events-none" style={{left: `${sec * PIXELS_PER_SECOND}px`}}>
                    <div className={`w-px ${sec % 5 === 0 ? 'h-6 bg-gray-600' : 'h-3 bg-gray-400'}`} />
                    {sec % 5 === 0 && <span className="text-sm text-gray-700 -ml-1.5 mt-1">{sec}s</span>}
                </div>
            ))}
        </div>

        {/* Timeline Tracks Area */}
        <div className="mb-8">
          <div 
            className="bg-gray-100 relative rounded-lg border-2 border-gray-300" 
            style={{ 
              width: `${timelineWidth}px`, 
              minHeight: `${timeline.tracks.length * DEFAULT_TRACK_HEIGHT}px` // Use minHeight for empty state
            }}
            onDragOver={(e) => e.preventDefault()} // Necessary for drop
            // Drop handler is coarse, just for testing the concept
            onDrop={(e) => {
                e.preventDefault();
                const itemString = e.dataTransfer.getData("text/plain");
                if (!itemString) return;
                
                const item: MediaBinItem = JSON.parse(itemString);
                const containerBounds = containerRef.current?.getBoundingClientRect();
                const timelineBounds = e.currentTarget.getBoundingClientRect();

                if (!containerBounds || !timelineBounds) return;
                
                const scrollLeft = containerRef.current?.scrollLeft || 0;
                // Calculate drop position relative to the timeline div
                const dropXInTimeline = e.clientX - timelineBounds.left + scrollLeft;
                
                // Determine which track was dropped on (very basic)
                const dropYInTimeline = e.clientY - timelineBounds.top;
                let trackIndex = Math.floor(dropYInTimeline / DEFAULT_TRACK_HEIGHT);
                trackIndex = Math.max(0, Math.min(timeline.tracks.length - 1, trackIndex));

                if (timeline.tracks[trackIndex]) {
                    handleDropOnTrack(item, timeline.tracks[trackIndex].id, dropXInTimeline);
                } else if (timeline.tracks.length > 0) {
                    // Fallback to last track if calculation is off (e.g. empty space below tracks)
                    handleDropOnTrack(item, timeline.tracks[timeline.tracks.length-1].id, dropXInTimeline);
                } else {
                    console.warn("No tracks to drop on, or track detection failed.");
                }
            }}
          >
            {/* Track backgrounds, labels, and grid lines */}
            {timeline.tracks.map((track, trackIndex) => (
              <div key={track.id} className="relative" style={{ height: `${DEFAULT_TRACK_HEIGHT}px` }}>
                {/* Track background */}
                <div
                  className={`absolute w-full border-b border-gray-300 ${
                    trackIndex % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                  }`}
                  style={{
                    top: `0px`, // Relative to parent div which is already positioned
                    height: `${DEFAULT_TRACK_HEIGHT}px`,
                  }}
                />
                
                {/* Track label and Delete Button */}
                <div
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none flex items-center"
                >
                  Track {trackIndex + 1}
                </div>
                <button 
                    onClick={() => handleDeleteTrack(track.id)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700 p-1 z-20"
                    title="Delete Track"
                >
                    🗑️ {/* Wastebasket emoji */}
                </button>
                
                {/* Grid lines every 100px (1 second) */}
                {Array.from({ length: Math.floor(timelineWidth / PIXELS_PER_SECOND) + 1 }, (_, index) => index).map((gridIndex) => (
                  <div
                    key={`grid-${track.id}-${gridIndex}`}
                    className="absolute h-full bg-gray-300"
                    style={{
                      left: `${gridIndex * PIXELS_PER_SECOND}px`,
                      top: `0px`,
                      width: '1px',
                      height: `${DEFAULT_TRACK_HEIGHT}px`,
                      opacity: gridIndex % 5 === 0 ? 0.6 : 0.3, // Major/minor ticks
                    }}
                  />
                ))}
              </div>
            ))}
            
            {/* Scrubbers */}
            {getAllScrubbers().map((scrubber) => (
              <Scrubber
                key={scrubber.id}
                scrubber={scrubber}
                timelineWidth={timelineWidth}
                otherScrubbers={getAllScrubbers().filter((s) => s.id !== scrubber.id)}
                onUpdate={handleUpdateScrubber}
                containerRef={containerRef}
                expandTimeline={expandTimeline}
                snapConfig={{ enabled: true, distance: 10 }}
                trackCount={timeline.tracks.length}
                // trackHeight={DEFAULT_TRACK_HEIGHT} // Passed to Scrubber
              />
            ))}
            {timeline.tracks.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>No tracks. Click "Add Track" to get started.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 