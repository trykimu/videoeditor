import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Scrubber } from "./Scrubber";
import {
  DEFAULT_TRACK_HEIGHT,
  PIXELS_PER_SECOND,
  type ScrubberState,
  type MediaBinItem,
  type TimelineState,
} from "./types";

interface TimelineTracksProps {
  timeline: TimelineState;
  timelineWidth: number;
  rulerPositionPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onDeleteTrack: (trackId: string) => void;
  onUpdateScrubber: (updatedScrubber: ScrubberState) => void;
  onDropOnTrack: (
    item: MediaBinItem,
    trackId: string,
    dropLeftPx: number
  ) => void;
  getAllScrubbers: () => ScrubberState[];
  expandTimeline: () => boolean;
  onRulerMouseDown: (e: React.MouseEvent) => void;
  pixelsPerSecond: number;
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
  pixelsPerSecond,
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
        className="relative overflow-auto flex-1 bg-timeline-background timeline-scrollbar"
        onScroll={onScroll}
      >
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
            const dropXInTimeline =
              e.clientX - timelineBounds.left + scrollLeft;
            const dropYInTimeline = e.clientY - timelineBounds.top + scrollTop;

            let trackIndex = Math.floor(dropYInTimeline / DEFAULT_TRACK_HEIGHT);
            trackIndex = Math.max(
              0,
              Math.min(timeline.tracks.length - 1, trackIndex)
            );

            if (timeline.tracks[trackIndex]) {
              onDropOnTrack(
                item,
                timeline.tracks[trackIndex].id,
                dropXInTimeline
              );
            } else if (timeline.tracks.length > 0) {
              onDropOnTrack(
                item,
                timeline.tracks[timeline.tracks.length - 1].id,
                dropXInTimeline
              );
            } else {
              console.warn("No tracks to drop on, or track detection failed.");
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
                className={`absolute w-full border-b border-border/30 transition-colors ${
                  trackIndex % 2 === 0
                    ? "bg-timeline-track hover:bg-timeline-track/80"
                    : "bg-timeline-background hover:bg-muted/20"
                }`}
                style={{
                  top: `0px`,
                  height: `${DEFAULT_TRACK_HEIGHT}px`,
                }}
              />

              {/* Track label */}
              <div
                className="absolute left-2 top-1 text-xs text-muted-foreground font-medium pointer-events-none select-none z-50"
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
                    backgroundColor: `rgb(var(--border) / ${
                      gridIndex % 5 === 0 ? 0.5 : 0.25
                    })`,
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
              otherScrubbers={getAllScrubbers().filter(
                (s) => s.id !== scrubber.id
              )}
              onUpdate={onUpdateScrubber}
              containerRef={containerRef}
              expandTimeline={expandTimeline}
              snapConfig={{ enabled: true, distance: 10 }}
              trackCount={timeline.tracks.length}
              pixelsPerSecond={pixelsPerSecond}
            />
          ))}

          {timeline.tracks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p className="text-sm">
                No tracks. Click "Track" to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
