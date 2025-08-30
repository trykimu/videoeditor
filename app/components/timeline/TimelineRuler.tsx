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
  scrollLeft: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  timelineWidth,
  rulerPositionPx,
  containerRef,
  onRulerDrag,
  onRulerMouseDown,
  pixelsPerSecond,
  scrollLeft,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeInputValue, setTimeInputValue] = useState("");

  // Calculate current timestamp
  const currentTimeInSeconds = rulerPositionPx / pixelsPerSecond;
  const currentFrame = Math.round(currentTimeInSeconds * FPS);

  // Format timestamp to always show HH:MM:SS.mmm (matches professional NLEs)
  const formatTimestamp = (timeInSeconds: number) => {
    const totalMs = Math.max(0, Math.round(timeInSeconds * 1000));
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  // Format ruler marks to mm:ss or HH:MM:SS, centered on major ticks
  const formatRulerMark = (timeInSeconds: number) => {
    const totalSeconds = Math.max(0, Math.floor(timeInSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
          totalSeconds = parseInt(minutes) * 60 + parseInt(seconds) + parseFloat(`0.${ms}`);
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

  // Fixed professional cadence (adaptive to zoom):
  // - Major ticks adapt between 10s → 5s → 1s based on zoom
  // - Mid-major 5s (only when majors are 10s)
  // - Minor 1s
  // - Micro 0.5s, 0.25s, 0.1s depending on zoom
  // - Frame-level ticks when extremely zoomed in
  const majorSeconds = pixelsPerSecond >= 500 ? 1 : pixelsPerSecond >= 180 ? 5 : 10;
  const MID_MAJOR_SECONDS = 5;
  const MINOR_SECONDS = 1;
  const MICRO_SECONDS = 0.5;
  const MICRO_QUARTER_SECONDS = 0.25;
  const MICRO_TENTH_SECONDS = 0.1;
  const FRAME_SECONDS = 1 / FPS;

  // Visibility thresholds (slightly lowered to show more markings)
  const showMidMajor = majorSeconds === 10 && pixelsPerSecond * MID_MAJOR_SECONDS >= 64;
  const showMinor = pixelsPerSecond * MINOR_SECONDS >= 6; // 1s ticks earlier
  const showMinorLabels = pixelsPerSecond >= 120; // show 1s labels when sufficiently zoomed
  // To reduce clutter at high zoom, require bigger thresholds for denser ticks
  const showMicro = pixelsPerSecond * MICRO_SECONDS >= 6; // 0.5s
  const showMicroQuarter = pixelsPerSecond * MICRO_QUARTER_SECONDS >= 10; // 0.25s
  const showMicroTenth = pixelsPerSecond * MICRO_TENTH_SECONDS >= 14; // 0.1s
  const showFrames = pixelsPerSecond * FRAME_SECONDS >= 18; // frame ticks
  const showFrameLabelsEvery = 10; // label every Nth frame to avoid clutter

  const formatMajorLabel = (seconds: number) => {
    const total = Math.floor(seconds);
    const mm = Math.floor((total % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = (total % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };
  const formatSubSecondLabel = (time: number, step: number) => {
    const totalMs = Math.round(time * 1000);
    const totalSeconds = Math.floor(totalMs / 1000);
    const mm = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = (totalSeconds % 60).toString().padStart(2, "0");
    const ms = totalMs % 1000;
    // Decide decimals based on step granularity
    if (step >= 0.5) {
      // show 1 decimal (tenths)
      const tenths = Math.round(ms / 100);
      return `${mm}:${ss}.${tenths}`;
    }
    if (step >= 0.25) {
      // show 2 decimals
      const hundredths = Math.round(ms / 10)
        .toString()
        .padStart(2, "0");
      return `${mm}:${ss}.${hundredths}`;
    }
    // 0.1s → 1 decimal is fine; but if even finer, fall back to 3 decimals
    if (step >= 0.1) {
      const tenths = Math.round(ms / 100);
      return `${mm}:${ss}.${tenths}`;
    }
    return `${mm}:${ss}.${ms.toString().padStart(3, "0")}`;
  };
  const formatFrameLabel = (time: number) => {
    const totalFrames = Math.round(time * FPS);
    const seconds = Math.floor(totalFrames / FPS);
    const frames = totalFrames % FPS;
    const mm = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    const ff = frames.toString().padStart(2, "0");
    return `${mm}:${ss}:${ff}`;
  };
  return (
    <div className="flex flex-shrink-0 h-6 border-b border-border/30">
      {/* Track controls header with timestamp display */}
      <div className="w-28 bg-muted/70 border-r border-border/50 flex-shrink-0 flex flex-col items-center justify-center py-1 px-2">
        {isEditingTime ? (
          <Input
            value={timeInputValue}
            onChange={(e) => setTimeInputValue(e.target.value)}
            onBlur={handleTimeInputSubmit}
            onKeyDown={handleTimeInputKeyDown}
            placeholder="00:00:00.000"
            className="h-3 text-xs font-mono w-full px-1 py-0 text-center border-0 bg-transparent focus:bg-muted/50 transition-colors"
            autoFocus
          />
        ) : (
          <div
            className="w-full text-xs font-mono text-foreground font-medium leading-none cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded transition-colors whitespace-nowrap overflow-hidden text-center"
            onClick={() => {
              setIsEditingTime(true);
              setTimeInputValue(formatTimestamp(currentTimeInSeconds));
            }}
            title="Click to edit time (supports mm:ss.ms, ss.ms, 120f formats)">
            {formatTimestamp(currentTimeInSeconds)}
          </div>
        )}
      </div>

      {/* Timeline Ruler */}
      <div
        className="bg-gradient-to-b from-muted/60 to-muted/40 cursor-pointer relative z-20 flex-1 overflow-hidden"
        style={{ height: "24px" }}>
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: `${timelineWidth}px`,
            transform: `translateX(-${scrollLeft}px)`,
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
          }}>
          {/* Major markings - adaptive with labels (no 00:00) */}
          {(() => {
            const elements: React.ReactNode[] = [];
            let lastLabelX = -Infinity;
            const minLabelSpacingPx = 40; // avoid label overlap
            const count = Math.floor(timelineWidth / (majorSeconds * pixelsPerSecond)) + 1;
            for (let tick = 0; tick < count; tick++) {
              const timeValue = tick * majorSeconds;
              const x = tick * majorSeconds * pixelsPerSecond;
              const showLabel = timeValue !== 0 && x - lastLabelX >= minLabelSpacingPx;
              if (showLabel) {
                lastLabelX = x;
              }
              elements.push(
                <div
                  key={`major-mark-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                  style={{ left: `${x}px` }}>
                  {showLabel ? (
                    <span className="text-[9px] text-muted-foreground -translate-x-1/2 mt-0.5 bg-background/90 px-1 py-0.5 rounded-sm border border-border/30 font-mono leading-none">
                      {formatMajorLabel(timeValue)}
                    </span>
                  ) : (
                    <span className="sr-only">{formatMajorLabel(timeValue)}</span>
                  )}
                  <div className="w-px bg-border h-4 mt-auto" />
                </div>,
              );
            }
            return elements;
          })()}

          {/* Mid-major 5s ticks with small label when dense */}
          {showMidMajor &&
            (() => {
              const elements: React.ReactNode[] = [];
              const count = Math.floor(timelineWidth / (MID_MAJOR_SECONDS * pixelsPerSecond)) + 1;
              for (let tick = 1; tick < count; tick++) {
                const timeValue = tick * MID_MAJOR_SECONDS;
                // skip those that coincide with major ticks
                if (timeValue % majorSeconds === 0) continue;
                const x = tick * MID_MAJOR_SECONDS * pixelsPerSecond;
                elements.push(
                  <div
                    key={`mid-major-${tick}`}
                    className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                    style={{ left: `${x}px` }}>
                    <span className="text-[8px] text-muted-foreground/80 -translate-x-1/2 mt-0.5 bg-background/80 px-1 py-0.5 rounded-sm border border-border/20 font-mono leading-none">
                      {formatMajorLabel(timeValue)}
                    </span>
                    <div className="w-px bg-border/80 h-3 mt-auto" />
                  </div>,
                );
              }
              return elements;
            })()}

          {/* Minor markings - 1s ticks with optional labels at high zoom */}
          {showMinor &&
            (() => {
              const elements: React.ReactNode[] = [];
              let lastLabelX = -Infinity;
              const minLabelSpacingPx = 36;
              const count = Math.floor(timelineWidth / (MINOR_SECONDS * pixelsPerSecond)) + 1;
              for (let tick = 0; tick < count; tick++) {
                const timeValue = tick * MINOR_SECONDS;
                const isMajorTick = timeValue % majorSeconds === 0;
                if (isMajorTick) continue;
                const x = tick * MINOR_SECONDS * pixelsPerSecond;
                const canShowLabel = showMinorLabels && x - lastLabelX >= minLabelSpacingPx;
                if (canShowLabel) lastLabelX = x;
                elements.push(
                  <div
                    key={`minor-mark-${tick}`}
                    className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                    style={{ left: `${x}px` }}>
                    {showMinorLabels && canShowLabel ? (
                      <span className="text-[8px] text-muted-foreground/80 -translate-x-1/2 mt-0.5 bg-background/80 px-1 py-0.5 rounded-sm border border-border/20 font-mono leading-none">
                        {formatSubSecondLabel(timeValue, MINOR_SECONDS)}
                      </span>
                    ) : (
                      <span className="sr-only">{formatSubSecondLabel(timeValue, MINOR_SECONDS)}</span>
                    )}
                    <div className="w-px bg-border/60 h-3 mt-auto" />
                  </div>,
                );
              }
              return elements;
            })()}

          {/* Micro markings - 0.5s ticks */}
          {showMicro &&
            Array.from(
              {
                length: Math.floor(timelineWidth / (MICRO_SECONDS * pixelsPerSecond)) + 1,
              },
              (_, index) => index,
            ).map((tick) => {
              const timeValue = tick * MICRO_SECONDS;
              const isMinorTick = timeValue % MINOR_SECONDS === 0;
              const isMajorTick = timeValue % majorSeconds === 0;
              if (isMinorTick || isMajorTick) return null;
              const x = tick * MICRO_SECONDS * pixelsPerSecond;
              const showLabel = pixelsPerSecond * MICRO_SECONDS >= 140; // label at very high zoom
              return (
                <div
                  key={`micro-mark-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                  style={{ left: `${x}px` }}>
                  {showLabel ? (
                    <span className="text-[8px] text-muted-foreground/70 -translate-x-1/2 mt-0.5 bg-background/70 px-1 py-0.5 rounded-sm border border-border/20 font-mono leading-none">
                      {formatSubSecondLabel(timeValue, MICRO_SECONDS)}
                    </span>
                  ) : (
                    <span className="sr-only">{formatSubSecondLabel(timeValue, MICRO_SECONDS)}</span>
                  )}
                  <div className="w-px bg-border/30 h-2 mt-auto" />
                </div>
              );
            })}

          {/* Micro 0.25s ticks */}
          {showMicroQuarter &&
            Array.from(
              {
                length: Math.floor(timelineWidth / (MICRO_QUARTER_SECONDS * pixelsPerSecond)) + 1,
              },
              (_, index) => index,
            ).map((tick) => {
              const timeValue = tick * MICRO_QUARTER_SECONDS;
              const isHigherTick =
                timeValue % MICRO_SECONDS === 0 || timeValue % MINOR_SECONDS === 0 || timeValue % majorSeconds === 0;
              if (isHigherTick) return null;
              const x = tick * MICRO_QUARTER_SECONDS * pixelsPerSecond;
              const showLabel = pixelsPerSecond * MICRO_QUARTER_SECONDS >= 160;
              return (
                <div
                  key={`micro-quarter-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                  style={{ left: `${x}px` }}>
                  {showLabel ? (
                    <span className="text-[7px] text-muted-foreground/70 -translate-x-1/2 mt-0.5 bg-background/60 px-1 py-[1px] rounded-sm border border-border/20 font-mono leading-none">
                      {formatSubSecondLabel(timeValue, MICRO_QUARTER_SECONDS)}
                    </span>
                  ) : (
                    <span className="sr-only">{formatSubSecondLabel(timeValue, MICRO_QUARTER_SECONDS)}</span>
                  )}
                  <div className="w-px bg-border/20 h-1.5 mt-auto" />
                </div>
              );
            })}

          {/* Micro 0.1s ticks */}
          {showMicroTenth &&
            Array.from(
              {
                length: Math.floor(timelineWidth / (MICRO_TENTH_SECONDS * pixelsPerSecond)) + 1,
              },
              (_, index) => index,
            ).map((tick) => {
              const timeValue = tick * MICRO_TENTH_SECONDS;
              const isHigherTick =
                timeValue % MICRO_QUARTER_SECONDS === 0 ||
                timeValue % MICRO_SECONDS === 0 ||
                timeValue % MINOR_SECONDS === 0 ||
                timeValue % majorSeconds === 0;
              if (isHigherTick) return null;
              const x = tick * MICRO_TENTH_SECONDS * pixelsPerSecond;
              const showLabel = pixelsPerSecond * MICRO_TENTH_SECONDS >= 200;
              return (
                <div
                  key={`micro-tenth-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                  style={{ left: `${x}px` }}>
                  {showLabel ? (
                    <span className="text-[7px] text-muted-foreground/60 -translate-x-1/2 mt-0.5 bg-background/50 px-1 py-[1px] rounded-sm border border-border/20 font-mono leading-none">
                      {formatSubSecondLabel(timeValue, MICRO_TENTH_SECONDS)}
                    </span>
                  ) : (
                    <span className="sr-only">{formatSubSecondLabel(timeValue, MICRO_TENTH_SECONDS)}</span>
                  )}
                  <div className="w-px bg-border/10 h-1 mt-auto" />
                </div>
              );
            })}

          {/* Frame-level ticks at extreme zoom */}
          {showFrames &&
            Array.from(
              {
                length: Math.floor(timelineWidth / (FRAME_SECONDS * pixelsPerSecond)) + 1,
              },
              (_, index) => index,
            ).map((tick) => {
              const timeValue = tick * FRAME_SECONDS;
              const isHigherTick =
                timeValue % MICRO_TENTH_SECONDS === 0 ||
                timeValue % MICRO_QUARTER_SECONDS === 0 ||
                timeValue % MICRO_SECONDS === 0 ||
                timeValue % MINOR_SECONDS === 0 ||
                timeValue % majorSeconds === 0;
              if (isHigherTick) return null;
              const x = tick * FRAME_SECONDS * pixelsPerSecond;
              const labelThis = tick % showFrameLabelsEvery === 0 && pixelsPerSecond * FRAME_SECONDS >= 16;
              return (
                <div
                  key={`frame-${tick}`}
                  className="absolute top-0 h-full flex flex-col justify-between pointer-events-none"
                  style={{ left: `${x}px` }}>
                  {labelThis ? (
                    <span className="text-[7px] text-muted-foreground/60 -translate-x-1/2 mt-0.5 bg-background/40 px-1 py-[1px] rounded-sm border border-border/10 font-mono leading-none">
                      {formatFrameLabel(timeValue)}
                    </span>
                  ) : (
                    <span className="sr-only">{formatFrameLabel(timeValue)}</span>
                  )}
                  <div className="w-px bg-border/10 h-0.5 mt-auto" />
                </div>
              );
            })}

          {/* Playhead line - contained within ruler */}
          <div
            className="absolute top-0 w-0.5 bg-primary pointer-events-none z-30 shadow-sm"
            style={{
              left: `${rulerPositionPx}px`,
              height: "24px",
            }}
          />

          {/* Playhead handle - compact design */}
          <div
            className="absolute bg-primary cursor-grab hover:cursor-grabbing z-30 border border-background shadow-lg hover:shadow-xl transition-shadow"
            style={{
              left: `${rulerPositionPx - 4}px`,
              top: "2px",
              width: "8px",
              height: "8px",
              borderRadius: "1px",
              transform: "none",
              transition: "box-shadow 0.15s ease",
            }}
            onMouseDown={onRulerMouseDown}
            title="Drag to seek"
          />
        </div>
      </div>
    </div>
  );
};
