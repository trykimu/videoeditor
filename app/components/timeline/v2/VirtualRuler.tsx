import React, { useMemo } from "react";
import { FPS, RULER_HEIGHT } from "../types";
import { snapPlayheadPx } from "./playhead-utils";

interface VirtualRulerProps {
  pixelsPerSecond: number;
  timelineWidth: number;
  rulerPositionPx: number;
  isDraggingRuler: boolean;
  onRulerMouseDown: (e: React.MouseEvent) => void;
  onRulerClick: (e: React.MouseEvent) => void;
}

interface RulerConfig {
  labelIntervalSeconds: number;
  tickIntervalSeconds: number;
}

function getRulerConfig(pixelsPerSecond: number, fps: number): RulerConfig {
  const MIN_LABEL_SPACING_PX = 120;
  const MIN_TICK_SPACING_PX = 6;

  const frameIntervals = [1, 2, 3, 5, 10, 15];
  for (const frames of frameIntervals) {
    const intervalSec = frames / fps;
    const px = intervalSec * pixelsPerSecond;
    if (px >= MIN_TICK_SPACING_PX) {
      for (const labelFrames of [2, 3, 5, 10, 15, 30, fps, fps * 2, fps * 5, fps * 10]) {
        const labelSec = labelFrames / fps;
        const labelPx = labelSec * pixelsPerSecond;
        if (labelPx >= MIN_LABEL_SPACING_PX) {
          return { labelIntervalSeconds: labelSec, tickIntervalSeconds: intervalSec };
        }
      }
    }
  }

  const secondMultipliers = [0.5, 1, 2, 3, 5, 10, 15, 30, 60, 120, 300, 600];
  for (const mult of secondMultipliers) {
    const px = mult * pixelsPerSecond;
    if (px >= MIN_TICK_SPACING_PX) {
      for (const labelMult of secondMultipliers) {
        const labelPx = labelMult * pixelsPerSecond;
        if (labelPx >= MIN_LABEL_SPACING_PX && labelMult >= mult) {
          return { labelIntervalSeconds: labelMult, tickIntervalSeconds: mult };
        }
      }
    }
  }

  return { labelIntervalSeconds: 60, tickIntervalSeconds: 10 };
}

/** Seconds as 0.5, 1, 1.5, 2 … or mm:ss when ≥ 1 minute. */
function formatTime(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
  const rounded = Math.round(seconds * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function VirtualRuler({
  pixelsPerSecond,
  timelineWidth,
  rulerPositionPx,
  isDraggingRuler,
  onRulerMouseDown,
  onRulerClick,
}: VirtualRulerProps) {
  const playheadLeft = snapPlayheadPx(rulerPositionPx);
  const config = useMemo(() => getRulerConfig(pixelsPerSecond, FPS), [pixelsPerSecond]);

  // Render ticks at ABSOLUTE timeline positions (no scrollLeft subtraction).
  // Since this ruler lives inside the sticky div inside the scroll container, the
  // browser handles horizontal clipping automatically — no virtualisation needed.
  const ticks = useMemo(() => {
    const { tickIntervalSeconds, labelIntervalSeconds } = config;
    const tickPx = tickIntervalSeconds * pixelsPerSecond;
    if (tickPx <= 0) return [];

    const totalSeconds = timelineWidth / pixelsPerSecond;
    const endTick = Math.ceil(totalSeconds / tickIntervalSeconds);
    const MAX_TICKS = 8000;

    const result: Array<{ x: number; isLabel: boolean; label: string; key: number }> = [];
    for (let i = 0; i <= Math.min(endTick, MAX_TICKS); i++) {
      const time = i * tickIntervalSeconds;
      const x = snapPlayheadPx(time * pixelsPerSecond);
      const isLabel =
        Math.abs(time % labelIntervalSeconds) < tickIntervalSeconds * 0.01 || time === 0;
      result.push({
        x,
        isLabel,
        label: isLabel ? formatTime(time) : "",
        key: i,
      });
    }
    return result;
  }, [config, pixelsPerSecond, timelineWidth]);

  return (
    <div
      className="relative select-none cursor-pointer bg-background border-b border-border overflow-hidden"
      style={{ width: timelineWidth, height: RULER_HEIGHT }}
      onMouseDown={onRulerMouseDown}
      onClick={onRulerClick}>

      {/* Tick marks — absolute positions in timeline space */}
      {ticks.map((tick) => (
        <div
          key={tick.key}
          className="absolute bottom-0 pointer-events-none"
          style={{ left: tick.x, transform: "translateX(-0.5px)" }}>
          <div
            className="absolute bottom-0 bg-border"
            style={{ width: 1, height: tick.isLabel ? 10 : 5 }}
          />
          {tick.isLabel && (
            <div
              className="absolute text-[10px] text-muted-foreground font-mono"
              style={{ bottom: 12, left: 3, whiteSpace: "nowrap" }}>
              {tick.label}
            </div>
          )}
        </div>
      ))}

      {/* Square head — sticky with ruler so it does not overlap ticks when tracks scroll */}
      <div
        className="absolute top-0 z-20 pointer-events-none"
        style={{ left: playheadLeft, height: RULER_HEIGHT, width: 0 }}>
        <div
          role="presentation"
          onMouseDown={onRulerMouseDown}
          className={`pointer-events-auto absolute top-0.5 left-0 size-2.5 -translate-x-1/2 cursor-col-resize border-2 border-primary/50 bg-primary shadow-xs ${
            isDraggingRuler ? "ring-2 ring-primary/40" : ""
          }`}
          style={{ borderRadius: 1 }}
        />
        <div className="absolute top-3 bottom-0 left-0 w-0.5 -translate-x-1/2 bg-primary" />
      </div>
    </div>
  );
}
