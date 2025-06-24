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
    console.log(JSON.stringify(getTimelineData(), null, 2))
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
    <div className="h-screen flex flex-col p-2 gap-2 bg-[#121212]">
      {/* =============== Header =============== */}
      <div className="bg-gray-800 border border-gray-700 flex rounded justify-between items-center p-3">
        <h1 className="text-white font-medium text-lg">EasyEdits</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddMediaClick}
            className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-4 py-2 text-sm font-medium hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors"
          >
            Import
          </button>
          <button 
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={handleRenderClick}
            disabled={isRendering}
          >
            {isRendering ? 'Rendering...' : 'Export'}
          </button>
        </div>
      </div>

      {/* =============== Main Content =============== */}
      <div className="bg-gray-800 border border-gray-700 rounded flex flex-row gap-2 p-2">

        {/* Side Panel */}
        <div className="bg-gray-700 border border-gray-600 rounded h-[360px]">
          <LeftPanel
            mediaBinItems={mediaBinItems}
            onAddMedia={handleAddMediaToBin}
            onAddText={handleAddTextToBin}
          />
        </div>

        {/* Player */}
        <div className="bg-gray-700 border border-gray-600 rounded flex flex-col gap-4 flex-1 p-3">
          <VideoPlayer
            timelineData={timelineData}
            durationInFrames={durationInFrames}
            ref={playerRef}
            compositionWidth={isAutoSize ? null : width}
            compositionHeight={isAutoSize ? null : height}
            timeline={timeline}
            handleUpdateScrubber={handleUpdateScrubber}
          />
        </div>
      </div>

      {/* =============== Controls =============== */}
      <div className="bg-gray-800 border border-gray-700 rounded flex flex-row justify-between items-center p-3">
        <div className="flex items-center gap-3">
          <button 
            className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 text-sm font-medium hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors"
            onClick={handleAddTrack}
          >
            + Add Track
          </button>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input
                type="checkbox"
                checked={isAutoSize}
                onChange={(e) => handleAutoSizeChange(e.target.checked)}
                className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
              />
              Auto Size
            </label>
            {!isAutoSize && (
              <>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 text-white px-2 py-1 w-20 rounded text-sm"
                  placeholder="Width"
                />
                <span className="text-gray-400">×</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 text-white px-2 py-1 w-20 rounded text-sm"
                  placeholder="Height"
                />
              </>
            )}
          </div>
        </div>
        <button 
          className="bg-gray-700 border border-gray-600 text-gray-100 rounded px-3 py-2 text-sm font-medium hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors"
          onClick={handleLogTimelineData}
        >
          Log Timeline
        </button>
      </div>

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
      {renderStatus && (
        <div className="bg-gray-800 border border-gray-700 rounded p-3">
          <RenderStatus renderStatus={renderStatus} />
        </div>
      )}

      {/* =============== Timeline =============== */}
      <div className="bg-gray-800 border border-gray-700 rounded flex flex-col w-full flex-1 min-h-0">
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