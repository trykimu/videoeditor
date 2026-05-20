import { useRef, useState, useCallback, useEffect } from "react";
import { MIN_ZOOM, MAX_ZOOM } from "~/components/timeline/types";

interface UseTimelineViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  onSetZoom: (level: number) => void;
  expandTimeline: () => boolean;
}

export function useTimelineViewport({
  containerRef,
  zoomLevel,
  onSetZoom,
  expandTimeline,
}: UseTimelineViewportOptions) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // RAF-batched zoom — accumulates wheel delta and fires once per animation frame
  const pendingWheelDeltaRef = useRef(0);
  const rafScheduledRef = useRef(false);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollLeft(el.scrollLeft);
    setScrollTop(el.scrollTop);
    expandTimeline();
  }, [expandTimeline]);

  // Edge auto-scroll state
  const edgeScrollRafRef = useRef<number | null>(null);
  const mouseXRef = useRef(0);

  const scheduleEdgeScroll = useCallback((mouseX: number) => {
    mouseXRef.current = mouseX;
    if (edgeScrollRafRef.current !== null) return;

    const tick = () => {
      const el = containerRef.current;
      if (!el) {
        edgeScrollRafRef.current = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      const mx = mouseXRef.current;
      const threshold = 100;
      const speed = 12;

      if (mx < rect.left + threshold) {
        el.scrollLeft = Math.max(0, el.scrollLeft - speed);
        setScrollLeft(el.scrollLeft);
        edgeScrollRafRef.current = requestAnimationFrame(tick);
      } else if (mx > rect.right - threshold) {
        el.scrollLeft += speed;
        setScrollLeft(el.scrollLeft);
        expandTimeline();
        edgeScrollRafRef.current = requestAnimationFrame(tick);
      } else {
        edgeScrollRafRef.current = null;
      }
    };

    edgeScrollRafRef.current = requestAnimationFrame(tick);
  }, [expandTimeline]);

  const stopEdgeScroll = useCallback(() => {
    if (edgeScrollRafRef.current !== null) {
      cancelAnimationFrame(edgeScrollRafRef.current);
      edgeScrollRafRef.current = null;
    }
  }, []);

  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Smooth exponential zoom (OpenCut zoom-controller pattern)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();

      pendingWheelDeltaRef.current += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        requestAnimationFrame(() => {
          const delta = pendingWheelDeltaRef.current;
          pendingWheelDeltaRef.current = 0;
          rafScheduledRef.current = false;
          const capped = Math.sign(delta) * Math.min(Math.abs(delta), 30);
          const factor = Math.exp(-capped / 300);
          const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevelRef.current * factor));
          onSetZoom(next);
        });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [containerRef, onSetZoom]);

  // Track viewport width for virtual ruler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    setViewportWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return {
    scrollLeft,
    scrollTop,
    viewportWidth,
    handleScroll,
    scheduleEdgeScroll,
    stopEdgeScroll,
  };
}
