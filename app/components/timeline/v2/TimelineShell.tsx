import React, { useEffect, useRef, useCallback } from "react";
import {
  RULER_HEIGHT,
  TRACK_LABEL_WIDTH,
  type ScrubberState,
  type MediaBinItem,
  type TimelineState,
  type TrackState,
  type Transition,
  type Keyframe,
} from "../types";
import { VirtualRuler } from "./VirtualRuler";
import { PlayheadLine } from "./PlayheadLine";
import { TrackLabelColumn } from "./TrackLabelColumn";
import { TrackRows } from "./TrackRows";

interface TimelineShellProps {
  // Layout
  timeline: TimelineState;
  timelineWidth: number;
  pixelsPerSecond: number;
  zoomLevel: number;

  // Playhead / ruler
  rulerPositionPx: number;
  isDraggingRuler: boolean;

  // Refs
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Scrubber ops
  selectedScrubberIds: string[];
  getAllScrubbers: () => ScrubberState[];
  onUpdateScrubber: (s: ScrubberState) => void;
  onDeleteScrubber?: (id: string) => void;
  onBeginScrubberTransform?: () => void;
  onSelectScrubber: (id: string | null, ctrlKey: boolean) => void;
  onGroupScrubbers: () => void;
  onUngroupScrubber: (id: string) => void;
  onMoveToMediaBin?: (id: string) => void;
  onRippleEdit?: (scrubberId: string, originalRightEdgePx: number, deltaPx: number) => void;

  // Track ops
  onDeleteTrack: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onSetTrackName: (trackId: string, name: string) => void;

  // Drop
  onDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void;
  onDropTransitionOnTrack: (transition: Transition, trackId: string, dropLeftPx: number) => void;
  onDeleteTransition: (transitionId: string) => void;
  expandTimeline: () => boolean;

  // Ruler events
  onRulerMouseDown: (e: React.MouseEvent) => void;
  onRulerClick: (e: React.MouseEvent) => void;

  // Scroll (called after scroll — for external state sync like ruler, etc.)
  onScroll: () => void;

  // Snap
  snapEnabled: boolean;

  // Keyframe lanes
  expandedIds: Set<string>;
  getTrackVisualHeight: (track: TrackState) => number;
  onToggleKeyframeLanes: (scrubberId: string) => void;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;

  // Box select
  onBoxSelect: (ids: string[]) => void;

  // Edge scroll
  scheduleEdgeScroll: (mouseX: number) => void;
  stopEdgeScroll: () => void;
}

export function TimelineShell({
  timeline,
  timelineWidth,
  pixelsPerSecond,
  rulerPositionPx,
  isDraggingRuler,
  containerRef,
  selectedScrubberIds,
  getAllScrubbers,
  onUpdateScrubber,
  onDeleteScrubber,
  onBeginScrubberTransform,
  onSelectScrubber,
  onGroupScrubbers,
  onUngroupScrubber,
  onMoveToMediaBin,
  onRippleEdit,
  onDeleteTrack,
  onToggleMute,
  onSetTrackName,
  onDropOnTrack,
  onDropTransitionOnTrack,
  onDeleteTransition,
  expandTimeline,
  onRulerMouseDown,
  onRulerClick,
  onScroll,
  snapEnabled,
  expandedIds,
  getTrackVisualHeight,
  onToggleKeyframeLanes,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onBoxSelect,
  scheduleEdgeScroll,
  stopEdgeScroll,
}: TimelineShellProps) {
  const totalTracksHeight = timeline.tracks.reduce(
    (sum, t) => sum + getTrackVisualHeight(t),
    0,
  );

  // Ref to the TrackLabelColumn's inner scrolling div — we sync it imperatively
  // on scroll so there is zero React-render lag on the label column.
  const labelScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current && labelScrollRef.current) {
      labelScrollRef.current.style.transform = `translateY(-${containerRef.current.scrollTop}px)`;
    }
    onScroll();
  }, [containerRef, onScroll]);

  // Global deselect on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest('[data-no-deselect="true"]')) return;
      const el = containerRef.current;
      if (el && !el.contains(target)) {
        onSelectScrubber(null, false);
      }
    };
    if (selectedScrubberIds.length > 0) {
      document.addEventListener("click", handleGlobalClick);
      return () => document.removeEventListener("click", handleGlobalClick);
    }
  }, [selectedScrubberIds, containerRef, onSelectScrubber]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Track label sidebar — stays fixed horizontally, syncs vertically via imperative ref */}
      <TrackLabelColumn
        tracks={timeline.tracks}
        scrollRef={labelScrollRef}
        expandedIds={expandedIds}
        getTrackVisualHeight={getTrackVisualHeight}
        onDeleteTrack={onDeleteTrack}
        onToggleMute={onToggleMute}
        onToggleKeyframeLanes={onToggleKeyframeLanes}
        onSetTrackName={onSetTrackName}
      />

      {/* Main scroll container — single overflow:auto that owns both horizontal AND
          vertical scroll. The ruler div inside it uses position:sticky so it
          sticks to the top when scrolling vertically while scrolling horizontally
          together with the track content. This eliminates ALL JavaScript-driven
          ruler sync and the associated scroll lag. */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto timeline-scrollbar"
        onScroll={handleScroll}>

        <div style={{ width: timelineWidth, minHeight: "100%" }}>
          {/* Sticky ruler — sticks to viewport top on vertical scroll,
              moves with content on horizontal scroll */}
          <div
            className="sticky top-0 z-10 bg-background"
            style={{ height: RULER_HEIGHT }}>
            <VirtualRuler
              pixelsPerSecond={pixelsPerSecond}
              timelineWidth={timelineWidth}
              rulerPositionPx={rulerPositionPx}
              isDraggingRuler={isDraggingRuler}
              onRulerMouseDown={onRulerMouseDown}
              onRulerClick={onRulerClick}
            />
          </div>

          {/* Track content area */}
          {timeline.tracks.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No tracks. Click "Track" to add one.</p>
            </div>
          ) : (
            <div className="relative" style={{ minHeight: totalTracksHeight }}>
              <PlayheadLine
                rulerPositionPx={rulerPositionPx}
                totalHeight={Math.max(totalTracksHeight, 200)}
              />
              <TrackRows
                timeline={timeline}
                timelineWidth={timelineWidth}
                rulerPositionPx={rulerPositionPx}
                containerRef={containerRef}
                scrollLeft={0}
                pixelsPerSecond={pixelsPerSecond}
                selectedScrubberIds={selectedScrubberIds}
                expandedIds={expandedIds}
                getTrackVisualHeight={getTrackVisualHeight}
                snapEnabled={snapEnabled}
                onUpdateScrubber={onUpdateScrubber}
                onDeleteScrubber={onDeleteScrubber}
                onBeginScrubberTransform={onBeginScrubberTransform}
                onDropOnTrack={onDropOnTrack}
                onDropTransitionOnTrack={onDropTransitionOnTrack}
                onDeleteTransition={onDeleteTransition}
                getAllScrubbers={getAllScrubbers}
                expandTimeline={expandTimeline}
                onSelectScrubber={onSelectScrubber}
                onGroupScrubbers={onGroupScrubbers}
                onUngroupScrubber={onUngroupScrubber}
                onMoveToMediaBin={onMoveToMediaBin}
                onRippleEdit={onRippleEdit}
                onBoxSelect={onBoxSelect}
                onToggleKeyframeLanes={onToggleKeyframeLanes}
                onAddKeyframe={onAddKeyframe}
                onUpdateKeyframe={onUpdateKeyframe}
                onDeleteKeyframe={onDeleteKeyframe}
                scheduleEdgeScroll={scheduleEdgeScroll}
                stopEdgeScroll={stopEdgeScroll}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
