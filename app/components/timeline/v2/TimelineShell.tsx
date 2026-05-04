import React, { useEffect } from "react";
import {
  RULER_HEIGHT,
  TRACK_LABEL_WIDTH,
  DEFAULT_TRACK_HEIGHT,
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
  scrollLeft: number;
  scrollTop: number;
  viewportWidth: number;

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

  // Scroll
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
  scrollLeft,
  scrollTop,
  viewportWidth,
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
      {/* Track label sidebar */}
      <TrackLabelColumn
        tracks={timeline.tracks}
        scrollTop={scrollTop}
        expandedIds={expandedIds}
        getTrackVisualHeight={getTrackVisualHeight}
        onDeleteTrack={onDeleteTrack}
        onToggleMute={onToggleMute}
        onToggleKeyframeLanes={onToggleKeyframeLanes}
        onSetTrackName={onSetTrackName}
      />

      {/* Scrollable timeline area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Virtual ruler — sticky at top */}
        <VirtualRuler
          pixelsPerSecond={pixelsPerSecond}
          scrollLeft={scrollLeft}
          viewportWidth={viewportWidth}
          rulerPositionPx={rulerPositionPx}
          isDraggingRuler={isDraggingRuler}
          onRulerMouseDown={onRulerMouseDown}
          onRulerClick={onRulerClick}
        />

        {/* Track content scroll container */}
        <div
          ref={containerRef}
          className={`relative flex-1 timeline-scrollbar ${
            timeline.tracks.length === 0 ? "overflow-hidden" : "overflow-auto"
          }`}
          onScroll={onScroll}>
          {timeline.tracks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No tracks. Click "Track" to add one.</p>
            </div>
          ) : (
            <div className="relative" style={{ minHeight: "100%" }}>
              {/* Playhead vertical line across track area */}
              <PlayheadLine
                rulerPositionPx={rulerPositionPx}
                scrollLeft={scrollLeft}
                totalHeight={Math.max(totalTracksHeight, 200)}
              />

              <TrackRows
                timeline={timeline}
                timelineWidth={timelineWidth}
                rulerPositionPx={rulerPositionPx}
                containerRef={containerRef}
                scrollLeft={scrollLeft}
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
