import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Scrubber } from "./Scrubber";
import { TransitionOverlay } from "./TransitionOverlay";
import {
  DEFAULT_TRACK_HEIGHT,
  PIXELS_PER_SECOND,
  type ScrubberState,
  type MediaBinItem,
  type TimelineState,
  type Transition,
} from "./types";

interface TimelineTracksProps {
  timeline: TimelineState;
  timelineWidth: number;
  rulerPositionPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onDeleteTrack: (trackId: string) => void;
  onUpdateScrubber: (updatedScrubber: ScrubberState) => void;
  onDeleteScrubber?: (scrubberId: string) => void;
  onDropOnTrack: (
    item: MediaBinItem,
    trackId: string,
    dropLeftPx: number
  ) => void;
  onDropTransitionOnTrack: (
    transition: Transition,
    trackId: string,
    dropLeftPx: number
  ) => void;
  onDeleteTransition: (transitionId: string) => void;
  getAllScrubbers: () => ScrubberState[];
  expandTimeline: () => boolean;
  onRulerMouseDown: (e: React.MouseEvent) => void;
  pixelsPerSecond: number;
  selectedScrubberId: string | null;
  onSelectScrubber: (scrubberId: string | null) => void;
}

export const TimelineTracks: React.FC<TimelineTracksProps> = ({
  timeline,
  timelineWidth,
  rulerPositionPx,
  containerRef,
  onScroll,
  onDeleteTrack,
  onUpdateScrubber,
  onDeleteScrubber,
  onDropOnTrack,
  onDropTransitionOnTrack,
  onDeleteTransition,
  getAllScrubbers,
  expandTimeline,
  onRulerMouseDown,
  pixelsPerSecond,
  selectedScrubberId,
  onSelectScrubber,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  // Sync track controls with timeline scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
      onScroll();
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onScroll, containerRef]);

  // Global click handler to deselect when clicking outside timeline
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const timelineContainer = containerRef.current;
      if (timelineContainer && !timelineContainer.contains(e.target as Node)) {
        onSelectScrubber(null);
      }
    };

    if (selectedScrubberId) {
      document.addEventListener("click", handleGlobalClick);
      return () => document.removeEventListener("click", handleGlobalClick);
    }
  }, [selectedScrubberId, containerRef, onSelectScrubber]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Track controls column - scrolls with tracks */}
      <div className="w-12 bg-muted border-r border-border/50 flex-shrink-0 overflow-hidden">
        <div
          className="flex flex-col"
          style={{
            transform: `translateY(-${containerRef.current?.scrollTop || 0}px)`,
            height: `${timeline.tracks.length * DEFAULT_TRACK_HEIGHT}px`,
          }}
        >
          {timeline.tracks.map((track, index) => (
            <div
              key={`control-${track.id}`}
              className="flex items-center justify-center border-b border-border/30 bg-muted/30 relative"
              style={{ height: `${DEFAULT_TRACK_HEIGHT}px` }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteTrack(track.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 relative z-10"
                title={`Delete Track ${index + 1}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {/* Track indicator line */}
              <div className="absolute right-0 top-0 bottom-0 w-px bg-border/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable Tracks Area */}
      <div
        ref={containerRef}
        className={`relative flex-1 bg-timeline-background timeline-scrollbar ${timeline.tracks.length === 0 ? "overflow-hidden" : "overflow-auto"
          }`}
        onScroll={timeline.tracks.length > 0 ? onScroll : undefined}
      >
        {timeline.tracks.length === 0 ? (
          /* Empty state - non-scrollable and centered */
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No tracks. Click "Track" to get started.</p>
          </div>
        ) : (
          <>
            {/* Playhead Line */}
            <div
              className="absolute top-0 w-0.5 bg-primary pointer-events-none z-40"
              style={{
                left: `${rulerPositionPx}px`,
                height: `${Math.max(
                  timeline.tracks.length * DEFAULT_TRACK_HEIGHT,
                  200
                )}px`,
              }}
            />

            {/* Tracks Content */}
            <div
              className="bg-timeline-background relative"
              style={{
                width: `${timelineWidth}px`,
                height: `${timeline.tracks.length * DEFAULT_TRACK_HEIGHT}px`,
                minHeight: "100%",
              }}
              onDragOver={(e) => e.preventDefault()}
              onClick={(e) => {
                // Deselect scrubber when clicking on empty timeline area
                if (e.target === e.currentTarget) {
                  onSelectScrubber(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();

                const jsonString = e.dataTransfer.getData("application/json");
                if (!jsonString) return;

                const data = JSON.parse(jsonString);

                // Use containerRef for consistent coordinate calculation like the ruler does
                const scrollContainer = containerRef.current;
                if (!scrollContainer) return;

                const containerBounds = scrollContainer.getBoundingClientRect();
                const scrollLeft = scrollContainer.scrollLeft || 0;
                const scrollTop = scrollContainer.scrollTop || 0;

                // Calculate drop position relative to the scroll container, accounting for scroll
                const dropXInTimeline = e.clientX - containerBounds.left + scrollLeft;
                const dropYInTimeline = e.clientY - containerBounds.top + scrollTop;

                let trackIndex = Math.floor(
                  dropYInTimeline / DEFAULT_TRACK_HEIGHT
                );
                trackIndex = Math.max(
                  0,
                  Math.min(timeline.tracks.length - 1, trackIndex)
                );

                const trackId = timeline.tracks[trackIndex]?.id;

                if (!trackId) {
                  console.warn("No tracks to drop on, or track detection failed.");
                  return;
                }

                // Handle transition drop
                if (data.type === "transition") {
                  onDropTransitionOnTrack(data, trackId, dropXInTimeline);
                } else {
                  // Handle media item drop
                  onDropOnTrack(data as MediaBinItem, trackId, dropXInTimeline);
                }
              }}
            >
              {/* Track backgrounds and grid lines */}
              {timeline.tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  className="relative"
                  style={{ height: `${DEFAULT_TRACK_HEIGHT}px` }}
                >
                  {/* Track background */}
                  <div
                    className={`absolute w-full border-b border-border/30 transition-colors ${trackIndex % 2 === 0
                      ? "bg-timeline-track hover:bg-timeline-track/80"
                      : "bg-timeline-background hover:bg-muted/20"
                      }`}
                    style={{
                      top: `0px`,
                      height: `${DEFAULT_TRACK_HEIGHT}px`,
                    }}
                    onClick={(e) => {
                      // Deselect scrubber when clicking on track background
                      if (e.target === e.currentTarget) {
                        onSelectScrubber(null);
                      }
                    }}
                  />

                  {/* Track label - positioned behind scrubbers */}
                  <div
                    className="absolute left-2 top-1 text-xs text-muted-foreground font-medium pointer-events-none select-none z-[5]"
                    style={{ userSelect: "none" }}
                  >
                    Track {trackIndex + 1}
                  </div>

                  {/* Grid lines */}
                  {Array.from(
                    { length: Math.floor(timelineWidth / pixelsPerSecond) + 1 },
                    (_, index) => index
                  ).map((gridIndex) => (
                    <div
                      key={`grid-${track.id}-${gridIndex}`}
                      className="absolute h-full pointer-events-none"
                      style={{
                        left: `${gridIndex * pixelsPerSecond}px`,
                        top: `0px`,
                        width: "1px",
                        height: `${DEFAULT_TRACK_HEIGHT}px`,
                        backgroundColor: `rgb(var(--border) / ${gridIndex % 5 === 0 ? 0.5 : 0.25
                          })`,
                      }}
                    />
                  ))}
                </div>
              ))}

              {/* Scrubbers */}
              {getAllScrubbers().map((scrubber) => {
                // Get all transitions for the track containing this scrubber
                const scrubberTrack = timeline.tracks.find(track =>
                  track.scrubbers.some(s => s.id === scrubber.id)
                );

                return (
                  <Scrubber
                    key={scrubber.id}
                    scrubber={scrubber}
                    timelineWidth={timelineWidth}
                    otherScrubbers={getAllScrubbers().filter(
                      (s) => s.id !== scrubber.id
                    )}
                    onUpdate={onUpdateScrubber}
                    onDelete={onDeleteScrubber}
                    isSelected={selectedScrubberId === scrubber.id}
                    onSelect={onSelectScrubber}
                    containerRef={containerRef}
                    expandTimeline={expandTimeline}
                    snapConfig={{ enabled: true, distance: 10 }}
                    trackCount={timeline.tracks.length}
                    pixelsPerSecond={pixelsPerSecond}
                  />
                );
              })}

              {/* Transitions */}
              {(() => {
                const transitionComponents = [];
                for (const track of timeline.tracks) {
                  for (const transition of track.transitions) {
                    const leftScrubber = transition.leftScrubberId ?
                      track.scrubbers.find(s => s.id === transition.leftScrubberId) || null : null;
                    const rightScrubber = transition.rightScrubberId ?
                      track.scrubbers.find(s => s.id === transition.rightScrubberId) || null : null;

                    transitionComponents.push(
                      <TransitionOverlay
                        key={transition.id}
                        transition={transition}
                        leftScrubber={leftScrubber}
                        rightScrubber={rightScrubber}
                        pixelsPerSecond={pixelsPerSecond}
                        onDelete={onDeleteTransition}
                      />
                    );
                  }
                }
                return transitionComponents;
              })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
