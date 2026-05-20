import React, { useState, useCallback, useEffect, useRef } from "react";
import type { ScrubberState } from "../types";

interface BoxSelectionProps {
  getScrubberBounds: (scrubber: ScrubberState) => { left: number; top: number; width: number; height: number } | null;
  allScrubbers: ScrubberState[];
  onBoxSelect: (ids: string[]) => void;
  children: React.ReactNode;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function rectsOverlap(a: Rect, b: { left: number; top: number; width: number; height: number }): boolean {
  return (
    a.x < b.left + b.width &&
    a.x + a.width > b.left &&
    a.y < b.top + b.height &&
    a.y + a.height > b.top
  );
}

function getScrubbersInRect(
  selection: Rect,
  scrubbers: ScrubberState[],
  getBounds: BoxSelectionProps["getScrubberBounds"],
): string[] {
  const ids: string[] = [];
  for (const s of scrubbers) {
    const b = getBounds(s);
    if (!b) continue;
    if (rectsOverlap(selection, b)) ids.push(s.id);
  }
  return ids;
}

/** Marquee select with right-click drag (does not conflict with left-click scrubber drag). */
export function BoxSelection({
  getScrubberBounds,
  allScrubbers,
  onBoxSelect,
  children,
}: BoxSelectionProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const rectRef = useRef<Rect | null>(null);
  const selectingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-scrubber]")) return;
    if ((e.target as HTMLElement).closest("[data-keyframe-lanes]")) return;
    if (e.button !== 2) return;

    e.preventDefault();
    startRef.current = { x: e.clientX, y: e.clientY };
    selectingRef.current = false;
    rectRef.current = null;
    setRect(null);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!startRef.current || !containerRef.current) return;
      const { x: sx, y: sy } = startRef.current;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;

      selectingRef.current = true;
      const bounds = containerRef.current.getBoundingClientRect();
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      const x1 = Math.min(sx, e.clientX) - bounds.left + scrollLeft;
      const y1 = Math.min(sy, e.clientY) - bounds.top + scrollTop;
      const x2 = Math.max(sx, e.clientX) - bounds.left + scrollLeft;
      const y2 = Math.max(sy, e.clientY) - bounds.top + scrollTop;

      const timelineRect: Rect = {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };
      rectRef.current = timelineRect;

      setRect({
        x: Math.min(sx, e.clientX),
        y: Math.min(sy, e.clientY),
        width: Math.abs(dx),
        height: Math.abs(dy),
      });
    };

    const onUp = () => {
      if (selectingRef.current && rectRef.current) {
        const ids = getScrubbersInRect(rectRef.current, allScrubbers, getScrubberBounds);
        onBoxSelect(ids);
      }
      startRef.current = null;
      selectingRef.current = false;
      rectRef.current = null;
      setRect(null);
    };

    const onContextMenu = (e: MouseEvent) => {
      if (selectingRef.current) e.preventDefault();
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("contextmenu", onContextMenu, true);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [allScrubbers, getScrubberBounds, onBoxSelect]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onPointerDown={handlePointerDown}
      onContextMenu={(e) => {
        if (selectingRef.current) e.preventDefault();
      }}>
      {children}
      {rect && (
        <div
          className="fixed pointer-events-none border-2 border-primary bg-primary/15 rounded-sm z-[100]"
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
