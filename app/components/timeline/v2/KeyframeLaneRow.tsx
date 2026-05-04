import React, { useCallback, useState, useRef } from "react";
import { KEYFRAME_LANE_HEIGHT } from "../types";
import type { KeyframeTrack, Keyframe, ScrubberState } from "../types";

interface KeyframeLaneRowProps {
  scrubber: ScrubberState;
  pixelsPerSecond: number;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;
}

export function KeyframeLaneRow({
  scrubber,
  pixelsPerSecond,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
}: KeyframeLaneRowProps) {
  const tracks = scrubber.keyframes?.tracks ?? [];

  // Show at least one empty lane if no keyframe tracks yet
  if (tracks.length === 0) {
    return (
      <EmptyKeyframeLane
        scrubber={scrubber}
        pixelsPerSecond={pixelsPerSecond}
        onAddKeyframe={onAddKeyframe}
      />
    );
  }

  return (
    <>
      {tracks.map((kt) => (
        <KeyframeSingleLane
          key={kt.property}
          scrubber={scrubber}
          track={kt}
          pixelsPerSecond={pixelsPerSecond}
          onAddKeyframe={onAddKeyframe}
          onUpdateKeyframe={onUpdateKeyframe}
          onDeleteKeyframe={onDeleteKeyframe}
        />
      ))}
    </>
  );
}

function EmptyKeyframeLane({
  scrubber,
  pixelsPerSecond,
  onAddKeyframe,
}: {
  scrubber: ScrubberState;
  pixelsPerSecond: number;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
}) {
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timeInSeconds = scrubber.left / pixelsPerSecond + clickX / pixelsPerSecond;
      onAddKeyframe(scrubber.id, "opacity", { timeInSeconds, value: 1, easing: "linear" });
    },
    [scrubber, pixelsPerSecond, onAddKeyframe],
  );

  return (
    <div
      className="relative border-t border-border/30 bg-muted/20 flex items-center"
      style={{ height: KEYFRAME_LANE_HEIGHT }}
      onDoubleClick={handleDoubleClick}>
      <span className="absolute left-0 px-2 text-[10px] text-muted-foreground/50 pointer-events-none">
        double-click to add keyframe
      </span>
    </div>
  );
}

function KeyframeSingleLane({
  scrubber,
  track,
  pixelsPerSecond,
  onAddKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
}: {
  scrubber: ScrubberState;
  track: KeyframeTrack;
  pixelsPerSecond: number;
  onAddKeyframe: (scrubberId: string, property: string, keyframe: Keyframe) => void;
  onUpdateKeyframe: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDeleteKeyframe: (scrubberId: string, property: string, timeInSeconds: number) => void;
}) {
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-keyframe-diamond]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const timeInSeconds = scrubber.left / pixelsPerSecond + clickX / pixelsPerSecond;
      onAddKeyframe(scrubber.id, track.property, { timeInSeconds, value: 1, easing: "linear" });
    },
    [scrubber, track.property, pixelsPerSecond, onAddKeyframe],
  );

  return (
    <div
      className="relative border-t border-border/30 bg-muted/10"
      style={{ height: KEYFRAME_LANE_HEIGHT }}
      onDoubleClick={handleDoubleClick}>
      {/* Lane background gradient */}
      <div className="absolute inset-0 opacity-30"
        style={{ background: "repeating-linear-gradient(90deg, transparent, transparent calc(var(--pps) * 1px - 1px), hsl(var(--border)) calc(var(--pps) * 1px))" }} />

      {track.keyframes.map((kf) => (
        <KeyframeDiamond
          key={kf.timeInSeconds}
          keyframe={kf}
          scrubber={scrubber}
          property={track.property}
          pixelsPerSecond={pixelsPerSecond}
          onUpdate={onUpdateKeyframe}
          onDelete={onDeleteKeyframe}
        />
      ))}
    </div>
  );
}

function KeyframeDiamond({
  keyframe,
  scrubber,
  property,
  pixelsPerSecond,
  onUpdate,
  onDelete,
}: {
  keyframe: Keyframe;
  scrubber: ScrubberState;
  property: string;
  pixelsPerSecond: number;
  onUpdate: (scrubberId: string, property: string, oldTime: number, newKeyframe: Keyframe) => void;
  onDelete: (scrubberId: string, property: string, timeInSeconds: number) => void;
}) {
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(keyframe.timeInSeconds);

  const x = (keyframe.timeInSeconds * pixelsPerSecond) - scrubber.left;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.button === 2) {
        onDelete(scrubber.id, property, keyframe.timeInSeconds);
        return;
      }
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      startTimeRef.current = keyframe.timeInSeconds;

      const onMove = (e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        const dx = e.clientX - startXRef.current;
        const newTime = Math.max(
          scrubber.left / pixelsPerSecond,
          startTimeRef.current + dx / pixelsPerSecond,
        );
        onUpdate(scrubber.id, property, keyframe.timeInSeconds, { ...keyframe, timeInSeconds: newTime });
      };

      const onUp = () => {
        isDraggingRef.current = false;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [keyframe, scrubber, property, pixelsPerSecond, onUpdate, onDelete],
  );

  return (
    <div
      data-keyframe-diamond
      className="absolute z-10 cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
      style={{
        left: x,
        top: "50%",
        width: 8,
        height: 8,
        transform: "translate(-50%, -50%) rotate(45deg)",
        backgroundColor: "hsl(var(--primary))",
        border: "1px solid hsl(var(--primary-foreground)/0.3)",
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        onDelete(scrubber.id, property, keyframe.timeInSeconds);
      }}
      title={`${property}: ${keyframe.value} @ ${keyframe.timeInSeconds.toFixed(2)}s`}
    />
  );
}
