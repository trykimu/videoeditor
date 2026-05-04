import React, { useMemo, useRef, useCallback } from "react";
import { FPS, RULER_HEIGHT } from "../types";

interface VirtualRulerProps {
  pixelsPerSecond: number;
  scrollLeft: number;
  viewportWidth: number;
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

  // Try frame-level ticks first (only at high zoom)
  const frameIntervals = [1, 2, 3, 5, 10, 15];
  for (const frames of frameIntervals) {
    const intervalSec = frames / fps;
    const px = intervalSec * pixelsPerSecond;
    if (px >= MIN_TICK_SPACING_PX) {
      // Find label interval
      for (const labelFrames of [2, 3, 5, 10, 15, 30, fps, fps * 2, fps * 5, fps * 10]) {
        const labelSec = labelFrames / fps;
        const labelPx = labelSec * pixelsPerSecond;
        if (labelPx >= MIN_LABEL_SPACING_PX) {
          return { labelIntervalSeconds: labelSec, tickIntervalSeconds: intervalSec };
        }
      }
    }
  }

  // Second-level ticks
  const secondMultipliers = [1, 2, 3, 5, 10, 15, 30, 60, 120, 300, 600];
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

function formatTime(seconds: number, fps: number, labelInterval: number): string {
  if (labelInterval < 1) {
    // Frame-level: show as Xf or X:XX.Xf
    const totalFrames = Math.round(seconds * fps);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = totalFrames % fps;
    if (mins > 0) {
      return `${mins}:${String(secs).padStart(2, "0")}.${String(frames).padStart(2, "0")}f`;
    }
    if (secs > 0) {
      return `${secs}.${String(frames).padStart(2, "0")}f`;
    }
    return `${frames}f`;
  }
  if (labelInterval < 60) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) return `${mins}:${String(secs).padStart(2, "0")}`;
    return `${secs}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function snapToDevicePixel(value: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.round(value * dpr) / dpr;
}

export function VirtualRuler({
  pixelsPerSecond,
  scrollLeft,
  viewportWidth,
  rulerPositionPx,
  isDraggingRuler,
  onRulerMouseDown,
  onRulerClick,
}: VirtualRulerProps) {
  const config = useMemo(() => getRulerConfig(pixelsPerSecond, FPS), [pixelsPerSecond]);

  const ticks = useMemo(() => {
    const BUFFER_PX = 200;
    const visibleStart = Math.max(0, scrollLeft - BUFFER_PX);
    const visibleEnd = scrollLeft + viewportWidth + BUFFER_PX;

    const { tickIntervalSeconds, labelIntervalSeconds } = config;
    const tickPx = tickIntervalSeconds * pixelsPerSecond;
    if (tickPx <= 0) return [];

    const startTick = Math.floor(visibleStart / tickPx);
    const endTick = Math.ceil(visibleEnd / tickPx);

    const result: Array<{ x: number; isLabel: boolean; label: string; time: number }> = [];
    for (let i = startTick; i <= endTick; i++) {
      const time = i * tickIntervalSeconds;
      const rawX = time * pixelsPerSecond - scrollLeft;
      const x = snapToDevicePixel(rawX);
      const isLabel =
        Math.abs(time % labelIntervalSeconds) < tickIntervalSeconds * 0.01 ||
        time === 0;
      result.push({
        x,
        isLabel,
        label: isLabel ? formatTime(time, FPS, labelIntervalSeconds) : "",
        time,
      });
    }
    return result;
  }, [config, pixelsPerSecond, scrollLeft, viewportWidth]);

  // Playhead handle position relative to viewport
  const playheadX = rulerPositionPx - scrollLeft;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden select-none cursor-pointer bg-background border-b border-border"
      style={{ height: RULER_HEIGHT }}
      onMouseDown={onRulerMouseDown}
      onClick={onRulerClick}>
      {/* Tick marks */}
      {ticks.map((tick) => (
        <div
          key={tick.time}
          className="absolute bottom-0 pointer-events-none"
          style={{ left: tick.x, transform: "translateX(-0.5px)" }}>
          <div
            className="absolute bottom-0 bg-border"
            style={{
              width: 1,
              height: tick.isLabel ? 10 : 5,
            }}
          />
          {tick.isLabel && (
            <div
              className="absolute text-[10px] text-muted-foreground font-mono"
              style={{
                bottom: 12,
                left: 3,
                whiteSpace: "nowrap",
              }}>
              {tick.label}
            </div>
          )}
        </div>
      ))}

      {/* Playhead handle — circular drag target */}
      <div
        className="absolute top-0 z-10 pointer-events-auto"
        style={{
          left: playheadX,
          transform: "translateX(-50%)",
          willChange: "left",
        }}>
        {/* Triangle pointer */}
        <div
          className="absolute"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: 16,
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "6px solid hsl(var(--primary))",
          }}
        />
        {/* Circle */}
        <div
          className={`flex items-center justify-center rounded-full cursor-col-resize ${
            isDraggingRuler ? "ring-2 ring-primary/50" : ""
          }`}
          style={{
            width: 14,
            height: 14,
            backgroundColor: "hsl(var(--primary))",
            marginTop: 2,
          }}
        />
      </div>

      {/* Thin playhead line across ruler */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: playheadX,
          width: 1,
          backgroundColor: "hsl(var(--primary))",
          opacity: 0.6,
          willChange: "left",
        }}
      />
    </div>
  );
}
