import React from "react"
import { Scrubber } from "./Scrubber"
import { DEFAULT_TRACK_HEIGHT, PIXELS_PER_SECOND, type TrackState, type ScrubberState, type MediaBinItem } from "./types"

interface TimelineTracksProps {
  timeline: {
    id: string
    tracks: TrackState[]
  }
  timelineWidth: number
  rulerPositionPx: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onScroll: () => void
  onDeleteTrack: (trackId: string) => void
  onUpdateScrubber: (updatedScrubber: ScrubberState) => void
  onDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void
  getAllScrubbers: () => ScrubberState[]
  expandTimeline: () => boolean
  onRulerMouseDown: (e: React.MouseEvent) => void
}

export const TimelineTracks: React.FC<TimelineTracksProps> = ({
  timeline,
  timelineWidth,
  rulerPositionPx,
  containerRef,
  onScroll,
  onDeleteTrack,
  onUpdateScrubber,
  onDropOnTrack,
  getAllScrubbers,
  expandTimeline,
  onRulerMouseDown,
}) => {
  return (
    <div className="flex flex-1 min-h-0">
      {/* Track delete buttons column */}
      <div className="flex flex-col bg-gray-50 border-r border-gray-300 flex-shrink-0" style={{ width: '60px' }}>
        {timeline.tracks.map((track) => (
          <div
            key={`delete-${track.id}`}
            className="flex items-center justify-center border-b border-gray-300"
            style={{ height: `${DEFAULT_TRACK_HEIGHT}px` }}
          >
            <button
              onClick={() => onDeleteTrack(track.id)}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded transition-colors"
              title="Delete Track"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Scrollable Tracks Area (containerRef) */}
      <div
        ref={containerRef}
        className="relative overflow-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-600 scrollbar-track-rounded scrollbar-thumb-rounded flex-1"
        onScroll={onScroll}
      >
        {/* Playhead Line - positioned relative to tracks */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-40"
          style={{
            left: `${rulerPositionPx}px`,
            height: '100%',
          }}
        />

        {/* Playhead Handle */}
        <div
          className="absolute w-3 h-3 bg-red-500 cursor-pointer z-50 hover:bg-red-600 transition-colors rounded-full border border-white"
          style={{
            left: `${rulerPositionPx - 6}px`,
            top: '-6px',
          }}
          onMouseDown={onRulerMouseDown}
          title="Drag to seek"
        />

        {/* Tracks Content */}
        <div
          className="bg-gray-100 relative"
          style={{
            width: `${timelineWidth}px`,
            height: `${timeline.tracks.length * DEFAULT_TRACK_HEIGHT}px`,
            minHeight: '100%',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const itemString = e.dataTransfer.getData("text/plain");
            if (!itemString) return;

            const item: MediaBinItem = JSON.parse(itemString);
            const timelineBounds = e.currentTarget.getBoundingClientRect();
            const tracksScrollContainer = e.currentTarget.parentElement;

            if (!timelineBounds || !tracksScrollContainer) return;

            const scrollLeft = tracksScrollContainer.scrollLeft || 0;
            const scrollTop = tracksScrollContainer.scrollTop || 0;
            const dropXInTimeline = e.clientX - timelineBounds.left + scrollLeft;
            const dropYInTimeline = e.clientY - timelineBounds.top + scrollTop;

            let trackIndex = Math.floor(dropYInTimeline / DEFAULT_TRACK_HEIGHT);
            trackIndex = Math.max(0, Math.min(timeline.tracks.length - 1, trackIndex));

            if (timeline.tracks[trackIndex]) {
              onDropOnTrack(item, timeline.tracks[trackIndex].id, dropXInTimeline);
            } else if (timeline.tracks.length > 0) {
              onDropOnTrack(item, timeline.tracks[timeline.tracks.length - 1].id, dropXInTimeline);
            } else {
              console.warn("No tracks to drop on, or track detection failed.");
            }
          }}
        >
          {/* Track backgrounds and grid lines */}
          {timeline.tracks.map((track, trackIndex) => (
            <div key={track.id} className="relative" style={{ height: `${DEFAULT_TRACK_HEIGHT}px` }}>
              {/* Track background */}
              <div
                className={`absolute w-full border-b border-gray-300 ${
                  trackIndex % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'
                }`}
                style={{
                  top: `0px`,
                  height: `${DEFAULT_TRACK_HEIGHT}px`,
                }}
              />

              {/* Track label - positioned at top-left with high z-index */}
              <div
                className="absolute left-2 top-1 text-xs text-gray-600 font-medium pointer-events-none select-none z-50"
                style={{ userSelect: 'none' }}
              >
                Track {trackIndex + 1}
              </div>

              {/* Grid lines */}
              {Array.from({ length: Math.floor(timelineWidth / PIXELS_PER_SECOND) + 1 }, (_, index) => index).map((gridIndex) => (
                <div
                  key={`grid-${track.id}-${gridIndex}`}
                  className="absolute h-full bg-gray-300"
                  style={{
                    left: `${gridIndex * PIXELS_PER_SECOND}px`,
                    top: `0px`,
                    width: '1px',
                    height: `${DEFAULT_TRACK_HEIGHT}px`,
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
              onUpdate={onUpdateScrubber}
              containerRef={containerRef}
              expandTimeline={expandTimeline}
              snapConfig={{ enabled: true, distance: 10 }}
              trackCount={timeline.tracks.length}
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
  )
} 