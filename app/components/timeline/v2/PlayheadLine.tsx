import React from "react";
import { RULER_HEIGHT } from "../types";

interface PlayheadLineProps {
  rulerPositionPx: number;
  scrollLeft: number;
  totalHeight: number;
}

export function PlayheadLine({ rulerPositionPx, scrollLeft, totalHeight }: PlayheadLineProps) {
  const x = rulerPositionPx - scrollLeft;

  return (
    <div
      className="absolute top-0 pointer-events-none z-40"
      style={{
        left: 0,
        top: RULER_HEIGHT,
        height: totalHeight,
        transform: `translateX(${x}px)`,
        width: 1,
        backgroundColor: "hsl(var(--primary))",
        willChange: "transform",
      }}
    />
  );
}
