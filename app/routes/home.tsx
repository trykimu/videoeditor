import React, { useRef, useEffect, useCallback, useState } from "react"
import type { PlayerRef } from "@remotion/player";

// Components
import LeftPanel from "~/components/editor/LeftPanel"
import { VideoPlayer } from "~/video-compositions/VideoPlayer"
import { TimelineControls } from "~/components/timeline/TimelineControls"
import { RenderStatus } from "~/components/timeline/RenderStatus"
import { TimelineRuler } from "~/components/timeline/TimelineRuler"
import { TimelineTracks } from "~/components/timeline/TimelineTracks"

// Hooks
import { useTimeline } from "~/hooks/useTimeline"
import { useMediaBin } from "~/hooks/useMediaBin"
import { useRuler } from "~/hooks/useRuler"
import { useRenderer } from "~/hooks/useRenderer"

// Types and constants
import { FPS } from "~/components/timeline/types"
import { Link, useNavigate } from "react-router";

export default function TimelineEditor() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation
  const navigate = useNavigate();

  // State for video dimensions
  const [width, setWidth] = useState<number>(1920)
  const [height, setHeight] = useState<number>(1080)
  const [isAutoSize, setIsAutoSize] = useState<boolean>(false)

  // Custom hooks
  const {
    timeline,
    timelineWidth,
    getTimelineData,
    expandTimeline,
    handleAddTrack,
    handleDeleteTrack,
    getAllScrubbers,
    handleUpdateScrubber,
    handleDropOnTrack,
  } = useTimeline()

  const {
    mediaBinItems,
    handleAddMediaToBin,
    handleAddTextToBin,
  } = useMediaBin()

  const {
    rulerPositionPx,
    isDraggingRuler,
    handleRulerDrag,
    handleRulerMouseDown,
    handleRulerMouseMove,
    handleRulerMouseUp,
    handleScroll,
  } = useRuler(playerRef, timelineWidth)

  const {
    isRendering,
    renderStatus,
    handleRenderVideo,
  } = useRenderer()

  // Derived values
  const timelineData = getTimelineData()
  const durationInFrames = (() => {
    let maxEndTime = 0;
    timelineData.forEach(timelineItem => {
      timelineItem.scrubbers.forEach(scrubber => {
        if (scrubber.endTime > maxEndTime) maxEndTime = scrubber.endTime;
      });
    });
    return Math.ceil(maxEndTime * FPS);
  })()

  // Event handlers
  const handleAddMediaClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleAddMediaToBin(file);
      e.target.value = "";
    }
  }, [handleAddMediaToBin])

  const handleRenderClick = useCallback(() => {
    handleRenderVideo(getTimelineData, timeline, isAutoSize ? null : width, isAutoSize ? null : height)
  }, [handleRenderVideo, getTimelineData, timeline, width, height, isAutoSize])

  const handleLogTimelineData = useCallback(() => {
    console.log(getTimelineData())
  }, [getTimelineData])

  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth)
  }, [])

  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight)
  }, [])

  const handleAutoSizeChange = useCallback((auto: boolean) => {
    setIsAutoSize(auto)
  }, [])

  const handleAddTextClick = useCallback(() => {
    navigate('/text-editor')
  }, [navigate])

  const expandTimelineCallback = useCallback(() => {
    return expandTimeline(containerRef)
  }, [expandTimeline])

  const handleScrollCallback = useCallback(() => {
    handleScroll(containerRef, expandTimelineCallback)
  }, [handleScroll, expandTimelineCallback])

  // Global spacebar play/pause functionality
  useEffect(() => {
    const handleGlobalKeyPress = (event: KeyboardEvent) => {
      // Only handle spacebar when not focused on input elements
      if (event.code === 'Space') {
        const target = event.target as HTMLElement;
        const isInputElement = target.tagName === 'INPUT' || 
                              target.tagName === 'TEXTAREA' || 
                              target.contentEditable === 'true' ||
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
    document.addEventListener('keydown', handleGlobalKeyPress);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, []); // Empty dependency array since we're accessing playerRef.current directly

  // Ruler mouse events
  useEffect(() => {
    if (isDraggingRuler) {
      const handleMouseMove = (e: MouseEvent) => handleRulerMouseMove(e, containerRef);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleRulerMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleRulerMouseUp);
      };
    }
  }, [isDraggingRuler, handleRulerMouseMove, handleRulerMouseUp]);

  return (
    <div className="h-screen w-full flex flex-col p-4">
      {/* Top Section: Media Bin and Player */}
      <div className="flex space-x-4 h-[300px] flex-shrink-0">
        {/* Top Left: Video Editor Left Panel with tabs */}
        <LeftPanel
          mediaBinItems={mediaBinItems}
          onAddMedia={handleAddMediaToBin}
          onAddText={handleAddTextToBin}
        />
        {/* Top Right: Video Player */}
        <VideoPlayer
          timelineData={timelineData}
          durationInFrames={durationInFrames}
          ref={playerRef}
          compositionWidth={isAutoSize ? null : width}
          compositionHeight={isAutoSize ? null : height}
        />
      </div>

      {/* Controls Section */}
      <TimelineControls
        onAddMedia={handleAddMediaClick}
        onAddText={handleAddTextClick}
        onAddTrack={handleAddTrack}
        onRenderVideo={handleRenderClick}
        onLogTimelineData={handleLogTimelineData}
        isRendering={isRendering}
        width={width}
        height={height}
        onWidthChange={handleWidthChange}
        onHeightChange={handleHeightChange}
        isAutoSize={isAutoSize}
        onAutoSizeChange={handleAutoSizeChange}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        id="media-upload-input"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Render Status */}
      <RenderStatus renderStatus={renderStatus} />

      {/* Bottom Section: Timeline */}
      <div className="w-full border rounded-lg bg-white shadow-lg flex flex-col flex-1 min-h-0">
        {/* Timeline Header: Delete Buttons + Ruler */}
        <TimelineRuler
          timelineWidth={timelineWidth}
          rulerPositionPx={rulerPositionPx}
          containerRef={containerRef}
          onRulerDrag={handleRulerDrag}
          onRulerMouseDown={handleRulerMouseDown}
        />

        {/* Timeline Content: Delete Buttons + Tracks */}
        <TimelineTracks
          timeline={timeline}
          timelineWidth={timelineWidth}
          rulerPositionPx={rulerPositionPx}
          containerRef={containerRef}
          onScroll={handleScrollCallback}
          onDeleteTrack={handleDeleteTrack}
          onUpdateScrubber={handleUpdateScrubber}
          onDropOnTrack={handleDropOnTrack}
          getAllScrubbers={getAllScrubbers}
          expandTimeline={expandTimelineCallback}
          onRulerMouseDown={handleRulerMouseDown}
        />
      </div>
    </div>
  );
} 