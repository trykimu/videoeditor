import React, { useCallback, useEffect, useRef, useState } from "react";

function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface PreviewFullscreenControlsProps {
  isFullscreen: boolean;
  currentTimeSec: number;
  durationSec: number;
  onSeek: (timeSec: number) => void;
}

/** Progress + time only; play / fullscreen use the center control bar. */
export function PreviewFullscreenControls({
  isFullscreen,
  currentTimeSec,
  durationSec,
  onSeek,
}: PreviewFullscreenControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const progress = durationSec > 0 ? Math.min(1, currentTimeSec / durationSec) : 0;

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const bar = barRef.current;
      if (!bar || durationSec <= 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * durationSec);
    },
    [durationSec, onSeek],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => seekFromClientX(e.clientX);
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, seekFromClientX]);

  if (!isFullscreen) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none pb-14">
      <div className="pointer-events-auto bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-8">
        <div
          ref={barRef}
          className="group relative h-1 w-full cursor-pointer rounded-full bg-white/25"
          onMouseDown={(e) => {
            setIsDragging(true);
            seekFromClientX(e.clientX);
          }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress * 100}% - 5px)` }}
          />
        </div>
        <p className="mt-2 text-[11px] font-mono tabular-nums text-white/90 text-center">
          {formatClock(currentTimeSec)} / {formatClock(durationSec)}
        </p>
      </div>
    </div>
  );
}
