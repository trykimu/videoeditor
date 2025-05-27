import React, { useState, useRef, useCallback, useEffect } from "react"
import { VideoPlayer } from "~/remotion/VideoPlayer"
import {parseMedia} from '@remotion/media-parser';
import axios from "axios"

interface ScrubberState {
  id: string
  left: number
  width: number
  mediaType: "video" | "image" | "text"
  mediaUrlLocal?: string
  mediaUrlRemote?: string
  y?: number // track position (0-based index)
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
  trackHeight: number
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
  trackHeight,
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
          const trackIndex = Math.floor(mouseY / trackHeight)
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
    [isDragging, isResizing, resizeMode, scrubber, timelineWidth, checkCollisionWithTrack, onUpdate, expandTimeline, containerRef, findSnapPoint, trackCount, trackHeight],
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
        top: `${(scrubber.y || 0) * trackHeight}px`,
        height: `${trackHeight}px`,
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

export default function TimelineEditor() {
  const [timeline, setTimeline] = useState<TimelineState>({
    id: "main",
    tracks: [
      {
        id: "track-1",
        scrubbers: [
          { id: "1-1", left: 50, width: 80, mediaType: "text", y: 0 },
        ],
      },
      {
        id: "track-2", 
        scrubbers: [],
      },
      {
        id: "track-3",
        scrubbers: [],
      },
    ],
  })
  const [timelineWidth, setTimelineWidth] = useState(2000)
  const [isRendering, setIsRendering] = useState(false)
  const [renderStatus, setRenderStatus] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)

  const EXPANSION_THRESHOLD = 200
  const EXPANSION_AMOUNT = 1000

  const getTimelineData = useCallback(() => {
    // Assuming 100 pixels = 1 second for conversion
    const PIXELS_PER_SECOND = 100;
    
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

  return (
    <div className="w-full max-w-4xl mx-auto mt-24 p-4">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Timeline Editor</h2>
        <div className="space-x-2">
          <button
            onClick={() => console.log(getTimelineData())}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Log Timeline Data
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
            onClick={handleAddTrack}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Track
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

      {/* Track Headers (Fixed) */}
      {timeline.tracks.map((track, index) => (
        <div key={`header-${track.id}`} className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Track {index + 1}</h3>
          <div className="space-x-2">
            <button
              onClick={() => {
                const fileInput = document.createElement('input')
                fileInput.type = 'file'
                fileInput.accept = 'video/*,image/*'
                fileInput.onchange = async (e) => {
                  const target = e.target as HTMLInputElement
                  const file = target.files?.[0]
                  console.log("File selected from header:", file);
                  if (file) {
                    try {
                      // Determine media type
                      const mediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : (() => { throw new Error("Invalid file type - must be video or image"); })();
                      
                      let width = 80; // Default width for images
                      
                      // Only parse media for videos since images don't have duration
                      if (mediaType === "video") {
                        console.log("Parsing video file for duration...");
                        const {durationInSeconds} = await parseMedia({
                          src: file,
                          fields: {
                            durationInSeconds: true,
                          }
                        })
                        width = ((durationInSeconds ?? 0) * 100) || 80;
                        console.log("Video duration:", durationInSeconds, "seconds, width:", width);
                      } else {
                        console.log("Image file detected, using default width");
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
                      
                      const newScrubber: ScrubberState = {
                        id: crypto.randomUUID(),
                        left: 50,
                        width: width,
                        mediaType: mediaType,
                        mediaUrlLocal: URL.createObjectURL(file), // For local preview
                        mediaUrlRemote: uploadResult.fullUrl, // For server access
                        y: index, // Set to current track index
                      }
                      console.log("Adding new scrubber from header:", newScrubber);
                      handleAddScrubberToTrack(track.id, newScrubber)
                    } catch (error) {
                      console.error("Error parsing media or adding scrubber:", error);
                      alert(`Failed to add media: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                  }
                }
                fileInput.click()
              }}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
            >
              Add Media
            </button>
            <button
              onClick={() => {
                const newScrubber: ScrubberState = {
                  id: crypto.randomUUID(),
                  left: 50,
                  width: 80,
                  mediaType: "text",
                  y: index, // Set to current track index
                }
                handleAddScrubberToTrack(track.id, newScrubber)
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Scrubber
            </button>
            <button
              onClick={() => handleDeleteTrack(track.id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete Track
            </button>
          </div>
        </div>
      ))}

      {/* Scrollable Timeline Content */}
      <div
        ref={containerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 scrollbar-track-rounded scrollbar-thumb-rounded"
        onScroll={handleScroll}
      >
        <div className="mb-8">
          {/* Timeline container with multiple tracks */}
          <div 
            className="bg-gray-100 relative rounded-lg border-2 border-gray-300" 
            style={{ 
              width: `${timelineWidth}px`, 
              height: `${timeline.tracks.length * 60}px` 
            }}
          >
            {/* Track separators and labels */}
            {timeline.tracks.map((track, trackIndex) => (
              <div key={track.id}>
                {/* Track background */}
                <div
                  className={`absolute w-full border-b border-gray-300 ${
                    trackIndex % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                  }`}
                  style={{
                    top: `${trackIndex * 60}px`,
                    height: `60px`,
                  }}
                />
                
                {/* Track label */}
                <div
                  className="absolute left-2 text-xs text-gray-500 font-medium pointer-events-none"
                  style={{
                    top: `${trackIndex * 60 + 4}px`,
                  }}
                >
                  Track {trackIndex + 1}
                </div>
                
                {/* Grid lines every 100px */}
                {Array.from({ length: Math.floor(timelineWidth / 100) + 1 }, (_, gridIndex) => (
                  <div
                    key={gridIndex}
                    className="absolute h-full bg-gray-300"
                    style={{
                      left: `${gridIndex * 100}px`,
                      top: `${trackIndex * 60}px`,
                      width: '1px',
                      height: `60px`,
                      opacity: gridIndex % 5 === 0 ? 0.6 : 0.3,
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
                trackHeight={60}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Video Preview Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Video Preview</h2>
        <div className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <VideoPlayer
            timelineData={getTimelineData()}
            durationInFrames={(() => {
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
            })()}
          />
        </div>
      </div>
    </div>
  )
} 