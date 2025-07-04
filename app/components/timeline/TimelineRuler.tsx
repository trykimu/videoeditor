import React, { useState, useEffect, useRef } from "react";
import { PIXELS_PER_SECOND, RULER_HEIGHT, FPS } from "./types";
import { Input } from "~/components/ui/input";

interface TimelineRulerProps {
  timelineWidth: number;
  rulerPositionPx: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onRulerDrag: (newPositionPx: number) => void;
  onRulerMouseDown: (e: React.MouseEvent) => void;
  pixelsPerSecond: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  timelineWidth,
  rulerPositionPx,
  containerRef,
  onRulerDrag,
  onRulerMouseDown,
  pixelsPerSecond,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState("");

  // Calculate current timestamp
  const currentTimeInSeconds = rulerPositionPx / pixelsPerSecond;
  const currentFrame = Math.round(currentTimeInSeconds * FPS);

  // Format timestamp in HH:MM:SS:mmm format with trailing zero removal
  const formatTimestamp = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds % 1) * 1000);

    // Format with appropriate precision, removing trailing zeros
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
    } else if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(3, "0")}`;
    } else {
      return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
    }
  };

  // Format ruler marks - simplified format for cleaner display
  const formatRulerMark = (timeInSeconds: number) => {
    if (timeInSeconds === 0) return "0s";

    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    if (hours > 0) {
      return `${hours}h${minutes > 0 ? `${minutes}m` : ""}`;
    } else if (minutes > 0) {
      return `${minutes}m${seconds > 0 ? `${seconds}s` : ""}`;
    } else {
      return `${seconds}s`;
    }
  };

  // Handle time input submission with improved parsing
  const handleTimeInputSubmit = () => {
    const timeString = timeInputValue.trim();
    if (!timeString) {
      setIsEditingTime(false);
      return;
    }

    // Parse various time formats (mm:ss.ms, ss.ms, ss, frames, etc.)
    let totalSeconds = 0;
    try {
      if (timeString.includes(":")) {
        // Format: mm:ss.ms or mm:ss
        const [minutes, secondsAndMs] = timeString.split(":");
        if (secondsAndMs.includes(".")) {
          const [seconds, ms] = secondsAndMs.split(".");
          totalSeconds =
            parseInt(minutes) * 60 + parseInt(seconds) + parseFloat(`0.${ms}`);
        } else {
          totalSeconds = parseInt(minutes) * 60 + parseInt(secondsAndMs);
        }
      } else if (timeString.includes(".")) {
        // Format: ss.ms
        totalSeconds = parseFloat(timeString);
      } else if (timeString.endsWith("f") || timeString.endsWith("F")) {
        // Format: frame number (e.g., "120f" for frame 120)
        const frameNum = parseInt(timeString.slice(0, -1));
        totalSeconds = frameNum / FPS;
      } else {
        // Plain number, treat as seconds
        totalSeconds = parseFloat(timeString);
      }

      const newPositionPx = totalSeconds * pixelsPerSecond;
      onRulerDrag(Math.max(0, Math.min(newPositionPx, timelineWidth)));
    } catch (error) {
      console.warn("Invalid time format:", timeString);
    }

    setIsEditingTime(false);
    setTimeInputValue("");
  };

  const handleTimeInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTimeInputSubmit();
    } else if (e.key === "Escape") {
      setIsEditingTime(false);
      setTimeInputValue("");
    }
  };

  // Determine intervals based on zoom level - more frequent markings like a real ruler
  const getRulerIntervals = () => {
    const pixelsPerSecondValue = pixelsPerSecond;

    if (pixelsPerSecondValue >= 800) {
      // Ultra-high zoom: major marks every 0.5s, medium every 0.1s, minor every 0.05s
      return { major: 0.5, medium: 0.1, minor: 0.05 };
    } else if (pixelsPerSecondValue >= 400) {
      // High zoom: major marks every 1s, medium every 0.2s, minor every 0.1s
      return { major: 1, medium: 0.2, minor: 0.1 };
    } else if (pixelsPerSecondValue >= 200) {
      // Medium-high zoom: major marks every 2s, medium every 0.5s, minor every 0.25s
      return { major: 2, medium: 0.5, minor: 0.25 };
    } else if (pixelsPerSecondValue >= 100) {
      // Medium zoom: major marks every 5s, medium every 1s, minor every 0.5s
      return { major: 5, medium: 1, minor: 0.5 };
    } else if (pixelsPerSecondValue >= 50) {
      // Normal zoom: major marks every 10s, medium every 2s, minor every 1s
      return { major: 10, medium: 2, minor: 1 };
    } else if (pixelsPerSecondValue >= 20) {
      // Low zoom: major marks every 30s, medium every 5s, minor every 2.5s
      return { major: 30, medium: 5, minor: 2.5 };
    } else {
      // Very low zoom: major marks every 60s, medium every 10s, minor every 5s
      return { major: 60, medium: 10, minor: 5 };
    }
  };

  const intervals = getRulerIntervals();
  return (
    <div className="flex flex-shrink-0 h-8">
      {/* Track controls header with timestamp display */}
      <div className="w-12 bg-muted border-r border-border/50 flex-shrink-0 flex flex-col items-center justify-center py-0.5">
        {isEditingTime ? (
          <Input
            value={timeInputValue}
            onChange={(e) => setTimeInputValue(e.target.value)}
            onBlur={handleTimeInputSubmit}
            onKeyDown={handleTimeInputKeyDown}
            placeholder="00:00.00"
            className="h-4 text-xs font-mono w-full px-1 py-0 text-center border-0 bg-transparent focus:bg-muted/50 transition-colors"
            autoFocus
          />
        ) : (
          <div
            className="text-xs font-mono text-foreground font-medium leading-none cursor-pointer hover:bg-muted/50 px-1 rounded transition-colors"
            onClick={() => {
              setIsEditingTime(true);
              setTimeInputValue(formatTimestamp(currentTimeInSeconds));
            }}
            title="Click to edit time (supports mm:ss.ms, ss.ms, 120f formats)"
          >
            {formatTimestamp(currentTimeInSeconds)}
          </div>
        )}
      </div>

      {/* Timeline Ruler */}
      <div
        className="bg-muted/50 border-b border-border/50 cursor-pointer relative z-50 flex-1 overflow-hidden"
        style={{ height: "32px" }}
      >
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: `${timelineWidth}px`,
            transform: `translateX(-${
              containerRef.current?.scrollLeft || 0
            }px)`,
          }}
          onClick={(e) => {
            if (containerRef.current) {
              // e.currentTarget is the ruler content div that's already positioned with transform
              // The click position relative to this div is already the correct timeline position
              const rulerRect = e.currentTarget.getBoundingClientRect();
              const clickXInRuler = e.clientX - rulerRect.left;
              
              // Since the ruler content is already transformed to account for scroll,
              // clickXInRuler is already the correct absolute position in the timeline
              onRulerDrag(clickXInRuler);
            }
          }}
        >
          {/* Major markings - ruler-style with timestamps */}
          {Array.from(
            {
              length:
                Math.floor(
                  timelineWidth / (intervals.major * pixelsPerSecond)
                ) + 1,
            },
            (_, index) => index
          ).map((tick) => {
            const timeValue = tick * intervals.major;

            return (
              <div
                key={`major-mark-${tick}`}
                className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                style={{
                  left: `${tick * intervals.major * pixelsPerSecond}px`,
                }}
              >
                <span className="text-[10px] text-muted-foreground -ml-2 mt-0.5 bg-background/90 px-1.5 py-0.5 rounded-sm border border-border/30 font-mono">
                  {formatRulerMark(timeValue)}
                </span>
                <div className="w-0.5 bg-border h-7 mt-auto" />
              </div>
            );
          })}

          {/* Medium markings - medium lines */}
          {Array.from(
            {
              length:
                Math.floor(
                  timelineWidth / (intervals.medium * pixelsPerSecond)
                ) + 1,
            },
            (_, index) => index
          ).map((tick) => {
            const timeValue = tick * intervals.medium;
            const isMajorTick = timeValue % intervals.major === 0;

            // Skip if this coincides with a major tick
            if (isMajorTick) return null;

            return (
              <div
                key={`medium-mark-${tick}`}
                className="absolute top-0 h-full flex flex-col justify-end pointer-events-none"
                style={{
                  left: `${tick * intervals.medium * pixelsPerSecond}px`,
                }}
              >
                <div className="w-px bg-border/60 h-4 mt-auto" />
              </div>
            );
          })}

          {/* Minor markings - small lines */}
          {intervals.minor * pixelsPerSecond >= 3 &&
            Array.from(
              {
                length:
                  Math.floor(
                    timelineWidth / (intervals.minor * pixelsPerSecond)
                  ) + 1,
              },
              (_, index) => index
            ).map((tick) => {
              const timeValue = tick * intervals.minor;
              const isMediumTick = timeValue % intervals.medium === 0;
              const isMajorTick = timeValue % intervals.major === 0;

              // Skip if this coincides with medium or major ticks
              if (isMediumTick || isMajorTick) return null;

              return (
                <div
                  key={`minor-mark-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-end pointer-events-none"
                  style={{
                    left: `${tick * intervals.minor * pixelsPerSecond}px`,
                  }}
                >
                  <div className="w-px bg-border/30 h-2 mt-auto" />
                </div>
              );
            })}

          {/* Playhead line - extends full height */}
          <div
            className="absolute top-0 w-0.5 bg-primary pointer-events-none z-50 shadow-sm"
            style={{
              left: `${rulerPositionPx}px`,
              height: "32px",
            }}
          />

          {/* Playhead handle - perfectly aligned with no lag or animations */}
          <div
            className="absolute bg-primary cursor-grab hover:cursor-grabbing z-50 border-2 border-background shadow-lg"
            style={{
              left: `${rulerPositionPx - 5}px`,
              top: "1px",
              width: "12px",
              height: "10px",
              borderRadius: "2px",
              transform: "none", // No transform to ensure perfect alignment
              transition: "none", // No transitions for immediate response
            }}
            onMouseDown={onRulerMouseDown}
            title="Drag to seek"
          />
        </div>
      </div>
    </div>
  );
};
