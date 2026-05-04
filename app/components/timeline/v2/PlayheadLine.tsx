import React from "react";

interface PlayheadLineProps {
  rulerPositionPx: number;
  totalHeight: number;
}

export function PlayheadLine({ rulerPositionPx, totalHeight }: PlayheadLineProps) {
  return (
    <div
      className="absolute top-0 pointer-events-none z-40"
      style={{
        left: rulerPositionPx,
        height: totalHeight,
        width: 1,
        backgroundColor: "hsl(var(--primary))",
        willChange: "left",
      }}
    />
  );
}
