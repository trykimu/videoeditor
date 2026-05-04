import React, { useMemo, useCallback } from "react";
import {
  DEFAULT_TRACK_HEIGHT,
  type ScrubberState,
  type MediaBinItem,
  type TimelineState,
  type TrackState,
  type Transition,
  type Keyframe,
} from "../types";
import { Scrubber } from "../Scrubber";
import { TransitionOverlay } from "../TransitionOverlay";
import { KeyframeLaneRow } from "./KeyframeLaneRow";
import { BoxSelection } from "./BoxSelection";
import { MediaBinItemSchema } from "~/schemas/components/timeline";

interface SnapIndicatorProps {
  x: number;
  height: number;
}

function SnapIndicator({ x, height }: SnapIndicatorProps) {
  return (
    <div
      className="absolute top-0 pointer-events-none z-50"
      style={{
        left: x,
        width: 1,
        height,
        backgroundColor: "hsl(var(--primary))",
        opacity: 0.8,
        boxShadow: "0 0 4px hsl(var(--primary))",
      }}
    />
  );
}

interface TrackRowsProps {
  timeline: TimelineState;
  timelineWidth: number;
  rulerPositionPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  scrollLeft: number;
  pixelsPerSecond: number;
  selectedScrubberIds: string[];
  expandedIds: Set<string>;
  getTrackVisualHeight: (track: TrackState) => number;
  snapEnabled: boolean;
  onUpdateScrubber: (updatedScrubber: ScrubberState) => void;
  onDeleteScrubber?: (scrubberId: string) => void;
  onBeginScrubberTransform?: () => void;
  onDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void;
  onDropTransitionOnTrack: (transition: Transition, trackId: string, dropLeftPx: number) => void;
  onDeleteTransition: (transitionId: string) => void;
  getAllScrubbers: () => ScrubberState[];
  expandTimeline: () => boolean;
  onSelectScrubber: (scrubberId: string | null, ctrlKey: boolean) => void;
  onGroupScrubbers: () => void;
  onUngroupScrubber: (scrubberId: string) => void;
  onMoveToMediaBin?: (scrubberId: string) => void;
  onRippleEdit?: (scrubberId: string, originalRightEdgePx: number, deltaPx: number) => void;
  onBoxSelect: (ids: string[]) => void;
  onToggleKeyframeLanes: (scrubberId: string) => void;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;
  scheduleEdgeScroll: (mouseX: number) => void;
  stopEdgeScroll: () => void;
}

export function TrackRows({
  timeline,
  timelineWidth,
  rulerPositionPx,
  containerRef,
  scrollLeft,
  pixelsPerSecond,
  selectedScrubberIds,
  expandedIds,
  getTrackVisualHeight,
  snapEnabled,
  onUpdateScrubber,
  onDeleteScrubber,
  onBeginScrubberTransform,
  onDropOnTrack,
  onDropTransitionOnTrack,
  onDeleteTransition,
  getAllScrubbers,
  expandTimeline,
  onSelectScrubber,
  onGroupScrubbers,
  onUngroupScrubber,
  onMoveToMediaBin,
  onRippleEdit,
  onBoxSelect,
  onToggleKeyframeLanes,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  scheduleEdgeScroll,
  stopEdgeScroll,
}: TrackRowsProps) {
  const allScrubbers = useMemo(() => getAllScrubbers(), [getAllScrubbers, timeline]);

  const totalHeight = useMemo(
    () => timeline.tracks.reduce((sum, t) => sum + getTrackVisualHeight(t), 0),
    [timeline.tracks, getTrackVisualHeight],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const jsonString = e.dataTransfer.getData("application/json");
      if (!jsonString) return;

      let data: unknown;
      try {
        data = JSON.parse(jsonString);
      } catch {
        return;
      }

      const scrollContainer = containerRef.current;
      if (!scrollContainer) return;

      const containerBounds = scrollContainer.getBoundingClientRect();
      const sl = scrollContainer.scrollLeft || 0;
      const st = scrollContainer.scrollTop || 0;

      const dropX = e.clientX - containerBounds.left + sl;
      const dropY = e.clientY - containerBounds.top + st;

      // Find track index accounting for variable row heights
      let trackIndex = 0;
      let cumY = 0;
      for (let i = 0; i < timeline.tracks.length; i++) {
        const h = getTrackVisualHeight(timeline.tracks[i]);
        if (dropY < cumY + h) {
          trackIndex = i;
          break;
        }
        cumY += h;
        trackIndex = i;
      }
      trackIndex = Math.max(0, Math.min(timeline.tracks.length - 1, trackIndex));
      const trackId = timeline.tracks[trackIndex]?.id;
      if (!trackId) return;

      if (
        typeof data === "object" &&
        data !== null &&
        "type" in data &&
        (data as { type?: string }).type === "transition"
      ) {
        onDropTransitionOnTrack(data as unknown as Transition, trackId, dropX);
      } else {
        const validated = MediaBinItemSchema.safeParse(data);
        if (!validated.success) return;
        onDropOnTrack(validated.data as unknown as MediaBinItem, trackId, dropX);
      }
    },
    [containerRef, timeline.tracks, getTrackVisualHeight, onDropOnTrack, onDropTransitionOnTrack],
  );

  // Track Y-offset cumulation for positioning scrubbers with expanded lanes
  const trackOffsets = useMemo(() => {
    const offsets: number[] = [];
    let cumulative = 0;
    for (const track of timeline.tracks) {
      offsets.push(cumulative);
      cumulative += getTrackVisualHeight(track);
    }
    return offsets;
  }, [timeline.tracks, getTrackVisualHeight]);

  return (
    <BoxSelection
      containerRef={containerRef}
      allScrubbers={allScrubbers}
      scrollLeft={scrollLeft}
      onBoxSelect={onBoxSelect}>
      <div
        className="relative bg-timeline-background"
        style={{ width: timelineWidth, height: totalHeight, minHeight: "100%" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelectScrubber(null, false);
        }}>

        {/* Track background stripes */}
        {timeline.tracks.map((track, trackIndex) => {
          const rowHeight = getTrackVisualHeight(track);
          const yOffset = trackOffsets[trackIndex] ?? 0;
          return (
            <div
              key={track.id}
              className={`absolute w-full border-b border-border/30 ${
                trackIndex % 2 === 0 ? "bg-timeline-track" : "bg-timeline-background"
              }`}
              style={{
                top: yOffset,
                height: rowHeight,
                backgroundImage: [
                  `repeating-linear-gradient(to right, rgb(var(--border) / 0.5) 0, rgb(var(--border) / 0.5) 1px, transparent 1px, transparent ${pixelsPerSecond * 5}px)`,
                  `repeating-linear-gradient(to right, rgb(var(--border) / 0.25) 0, rgb(var(--border) / 0.25) 1px, transparent 1px, transparent ${pixelsPerSecond}px)`,
                ].join(", "),
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) onSelectScrubber(null, false);
              }}
            />
          );
        })}

        {/* Scrubbers + keyframe lanes */}
        {allScrubbers.map((scrubber) => {
          const isExpanded = expandedIds.has(scrubber.id);
          return (
            <React.Fragment key={scrubber.id}>
              <Scrubber
                scrubber={scrubber}
                timelineWidth={timelineWidth}
                otherScrubbers={allScrubbers.filter((s) => s.id !== scrubber.id)}
                onUpdate={onUpdateScrubber}
                onDelete={onDeleteScrubber}
                isSelected={selectedScrubberIds.includes(scrubber.id)}
                onSelect={onSelectScrubber}
                onGroupScrubbers={onGroupScrubbers}
                onUngroupScrubber={onUngroupScrubber}
                onMoveToMediaBin={onMoveToMediaBin}
                selectedScrubberIds={selectedScrubberIds}
                containerRef={containerRef}
                expandTimeline={expandTimeline}
                snapConfig={{ enabled: snapEnabled, distance: 10 }}
                trackCount={timeline.tracks.length}
                pixelsPerSecond={pixelsPerSecond}
                rulerPositionPx={rulerPositionPx}
                onBeginTransform={onBeginScrubberTransform}
                onRippleEdit={onRippleEdit}
                onToggleKeyframeLanes={onToggleKeyframeLanes}
              />
              {isExpanded && (
                <div
                  className="absolute"
                  style={{
                    left: scrubber.left,
                    top: (scrubber.y || 0) * DEFAULT_TRACK_HEIGHT + DEFAULT_TRACK_HEIGHT,
                    width: scrubber.width,
                  }}>
                  <KeyframeLaneRow
                    scrubber={scrubber}
                    pixelsPerSecond={pixelsPerSecond}
                    onAddKeyframe={onAddKeyframe}
                    onUpdateKeyframe={onUpdateKeyframe}
                    onDeleteKeyframe={onDeleteKeyframe}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Transitions */}
        {(() => {
          const components = [];
          for (const track of timeline.tracks) {
            for (const transition of track.transitions) {
              const left = transition.leftScrubberId
                ? allScrubbers.find((s) => s.id === transition.leftScrubberId) ?? null
                : null;
              const right = transition.rightScrubberId
                ? allScrubbers.find((s) => s.id === transition.rightScrubberId) ?? null
                : null;
              if (left == null && right == null) continue;
              components.push(
                <TransitionOverlay
                  key={transition.id}
                  transition={transition}
                  leftScrubber={left}
                  rightScrubber={right}
                  pixelsPerSecond={pixelsPerSecond}
                  onDelete={onDeleteTransition}
                />,
              );
            }
          }
          return components;
        })()}
      </div>
    </BoxSelection>
  );
}
