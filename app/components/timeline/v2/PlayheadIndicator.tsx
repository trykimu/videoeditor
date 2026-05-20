import React from "react";
import { snapPlayheadPx } from "./playhead-utils";

interface TrackPlayheadLineProps {
  rulerPositionPx: number;
  totalTracksHeight: number;
}

/** Playhead line in tracks only — ruler head lives in sticky VirtualRuler to avoid scroll overlap. */
export function TrackPlayheadLine({ rulerPositionPx, totalTracksHeight }: TrackPlayheadLineProps) {
  const left = snapPlayheadPx(rulerPositionPx);

  return (
    <div
      className="absolute top-0 z-30 pointer-events-none"
      style={{ left, height: Math.max(totalTracksHeight, 200), width: 0 }}>
      <div className="absolute top-0 bottom-0 left-0 w-0.5 -translate-x-1/2 bg-primary" />
    </div>
  );
}
