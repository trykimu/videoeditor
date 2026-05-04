import React, { useState, useCallback, useEffect, useRef } from "react";
import type { ScrubberState } from "../types";
import { DEFAULT_TRACK_HEIGHT } from "../types";

interface BoxSelectionProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  allScrubbers: ScrubberState[];
  scrollLeft: number;
  onBoxSelect: (ids: string[]) => void;
  children: React.ReactNode;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getScrubbersInRect(
  rect: Rect,
  scrubbers: ScrubberState[],
  containerBounds: DOMRect,
  scrollLeft: number,
  scrollTop: number,
): string[] {
  const ids: string[] = [];
  for (const s of scrubbers) {
    const sLeft = s.left - scrollLeft + containerBounds.left;
    const sRight = sLeft + s.width;
    const sTop = (s.y || 0) * DEFAULT_TRACK_HEIGHT - scrollTop + containerBounds.top;
    const sBottom = sTop + DEFAULT_TRACK_HEIGHT - 4;

    const rectRight = rect.x + rect.width;
    const rectBottom = rect.y + rect.height;

    const overlaps =
      sLeft < rectRight &&
      sRight > rect.x &&
      sTop < rectBottom &&
      sBottom > rect.y;

    if (overlaps) ids.push(s.id);
  }
  return ids;
}

export function BoxSelection({
  containerRef,
  allScrubbers,
  scrollLeft,
  onBoxSelect,
  children,
}: BoxSelectionProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const scrollTopRef = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only start box select on background clicks (not on scrubbers)
      if ((e.target as HTMLElement).closest("[data-scrubber]")) return;
      if (e.button !== 0) return;

      startRef.current = { x: e.clientX, y: e.clientY };
      scrollTopRef.current = containerRef.current?.scrollTop ?? 0;
    },
    [containerRef],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!startRef.current) return;
      const { x: sx, y: sy } = startRef.current;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;

      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;

      setRect({
        x: Math.min(sx, e.clientX),
        y: Math.min(sy, e.clientY),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    };

    const onUp = (e: PointerEvent) => {
      if (startRef.current && rect) {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          const ids = getScrubbersInRect(
            rect,
            allScrubbers,
            bounds,
            scrollLeft,
            scrollTopRef.current,
          );
          onBoxSelect(ids);
        }
      }
      startRef.current = null;
      setRect(null);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [rect, allScrubbers, containerRef, scrollLeft, onBoxSelect]);

  return (
    <div className="relative w-full h-full" onPointerDown={handlePointerDown}>
      {children}
      {rect && (
        <div
          className="fixed pointer-events-none border border-primary/60 bg-primary/10 rounded-sm z-50"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          }}
        />
      )}
    </div>
  );
}
