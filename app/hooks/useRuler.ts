import { useState, useCallback, useEffect, useRef } from "react";
import type { PlayerRef } from "@remotion/player";
import { PIXELS_PER_SECOND, FPS } from "~/components/timeline/types";

export const useRuler = (
  playerRef: React.RefObject<PlayerRef | null>,
  timelineWidth: number,
  pixelsPerSecond: number
) => {
  const [rulerPositionPx, setRulerPositionPx] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);

  const isSeekingRef = useRef(false);
  const isUpdatingFromPlayerRef = useRef(false);

  const handleRulerDrag = useCallback(
    (newPositionPx: number) => {
      const clampedPositionPx = Math.max(
        0,
        Math.min(newPositionPx, timelineWidth)
      );
      setRulerPositionPx(clampedPositionPx);

      // Sync with player when not already updating from player
      if (playerRef.current && !isUpdatingFromPlayerRef.current) {
        isSeekingRef.current = true;
        const timeInSeconds = clampedPositionPx / pixelsPerSecond;
        const frame = Math.round(timeInSeconds * FPS);
        playerRef.current.seekTo(frame);
        // Reset seeking flag on next animation frame
        requestAnimationFrame(() => {
          isSeekingRef.current = false;
        });
      }
    },
    [timelineWidth, playerRef, pixelsPerSecond]
  );

  const handleRulerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRuler(true);
  }, []);

  const handleRulerMouseMove = useCallback(
    (e: MouseEvent, containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!isDraggingRuler || !containerRef.current) return;

      e.preventDefault();

      // Get the timeline container (the one that scrolls)
      const timelineContainer = containerRef.current;
      const rect = timelineContainer.getBoundingClientRect();

      // Calculate mouse position relative to the timeline, accounting for scroll
      const scrollLeft = timelineContainer.scrollLeft || 0;
      const mouseX = e.clientX - rect.left + scrollLeft;

      handleRulerDrag(mouseX);
    },
    [isDraggingRuler, handleRulerDrag]
  );

  const handleRulerMouseUp = useCallback(() => {
    setIsDraggingRuler(false);
  }, []);

  const updateRulerFromPlayer = useCallback(
    (frame: number) => {
      if (!isSeekingRef.current) {
        isUpdatingFromPlayerRef.current = true;
        const timeInSeconds = frame / FPS;
        const newPositionPx = timeInSeconds * pixelsPerSecond;
        setRulerPositionPx(Math.max(0, Math.min(newPositionPx, timelineWidth)));
        // Reset flag after state update
        requestAnimationFrame(() => {
          isUpdatingFromPlayerRef.current = false;
        });
      }
    },
    [pixelsPerSecond, timelineWidth]
  );

  const handleScroll = useCallback(
    (
      containerRef: React.RefObject<HTMLDivElement | null>,
      expandTimeline: () => boolean
    ) => {
      if (containerRef.current) {
        setScrollLeft(containerRef.current.scrollLeft);
      }
      expandTimeline();
    },
    []
  );

  // No smoothing: frame updates drive the ruler; explicit seeks happen on drag or click

  // Listen for player frame updates
  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      const handleFrameUpdate = (e: { detail: { frame: number } }) => {
        // Don't update ruler position if we're seeking or dragging
        if (isSeekingRef.current || isDraggingRuler) return;

        const currentFrame = e.detail.frame;
        const currentTimeInSeconds = currentFrame / FPS;
        const newPositionPx = currentTimeInSeconds * pixelsPerSecond;
        isUpdatingFromPlayerRef.current = true;
        setRulerPositionPx(newPositionPx);
        requestAnimationFrame(() => {
          isUpdatingFromPlayerRef.current = false;
        });
      };

      const handleSeeked = () => {
        // Small delay to ensure seek is complete
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 50);
      };

      player.addEventListener("frameupdate", handleFrameUpdate);
      player.addEventListener("seeked", handleSeeked);

      return () => {
        player.removeEventListener("frameupdate", handleFrameUpdate);
        player.removeEventListener("seeked", handleSeeked);
      };
    }
  }, [isDraggingRuler, rulerPositionPx, playerRef, pixelsPerSecond]);

  return {
    rulerPositionPx,
    scrollLeft,
    isDraggingRuler,
    handleRulerDrag,
    handleRulerMouseDown,
    handleRulerMouseMove,
    handleRulerMouseUp,
    handleScroll,
    updateRulerFromPlayer,
  };
};
