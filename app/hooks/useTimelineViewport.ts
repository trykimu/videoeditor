import { useRef, useState, useCallback, useEffect } from "react";

interface UseTimelineViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onZoomIn: () => void;
  onZoomOut: () => void;
  expandTimeline: () => boolean;
}

export function useTimelineViewport({
  containerRef,
  onZoomIn,
  onZoomOut,
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

  // Wire wheel handler with RAF batching for zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const isZoom = e.ctrlKey || e.metaKey;
      if (!isZoom) return;
      e.preventDefault();

      pendingWheelDeltaRef.current += e.deltaY;

      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        requestAnimationFrame(() => {
          const delta = pendingWheelDeltaRef.current;
          pendingWheelDeltaRef.current = 0;
          rafScheduledRef.current = false;
          if (delta > 0) {
            onZoomOut();
          } else {
            onZoomIn();
          }
        });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoomIn, onZoomOut]);

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
