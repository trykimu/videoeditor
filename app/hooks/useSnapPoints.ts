import { useMemo, useCallback } from "react";
import type { ScrubberState } from "~/components/timeline/types";

export type SnapPointType = "element-start" | "element-end" | "playhead" | "grid";

export interface SnapPoint {
  type: SnapPointType;
  position: number;
  scrubberId?: string;
}

export interface SnapResult {
  snappedPx: number;
  snapPoint: SnapPoint | null;
}

export function resolveTimelineSnap(
  rawPx: number,
  snapPoints: SnapPoint[],
  threshold: number,
): SnapResult {
  let closest: SnapPoint | null = null;
  let closestDist = Infinity;

  for (const sp of snapPoints) {
    const dist = Math.abs(rawPx - sp.position);
    if (dist < threshold && dist < closestDist) {
      closestDist = dist;
      closest = sp;
    }
  }

  return {
    snappedPx: closest ? closest.position : rawPx,
    snapPoint: closest,
  };
}

// Threshold scales with zoom: more zoomed in → tighter snapping in pixels
export function getSnapThreshold(zoomLevel: number): number {
  return Math.max(4, 10 / zoomLevel);
}

interface UseSnapPointsOptions {
  enabled: boolean;
  zoomLevel: number;
  pixelsPerSecond: number;
  timelineWidth: number;
  otherScrubbers: ScrubberState[];
  rulerPositionPx?: number;
}

export function useSnapPoints({
  enabled,
  zoomLevel,
  pixelsPerSecond,
  timelineWidth,
  otherScrubbers,
  rulerPositionPx,
}: UseSnapPointsOptions) {
  const threshold = useMemo(() => getSnapThreshold(zoomLevel), [zoomLevel]);

  const gridSnapPoints = useMemo<SnapPoint[]>(() => {
    const points: SnapPoint[] = [];
    for (let pos = 0; pos <= timelineWidth; pos += pixelsPerSecond) {
      points.push({ type: "grid", position: pos });
    }
    return points;
  }, [timelineWidth, pixelsPerSecond]);

  const scrubberSnapPoints = useMemo<SnapPoint[]>(() => {
    const points: SnapPoint[] = [];
    for (const s of otherScrubbers) {
      points.push({ type: "element-start", position: s.left, scrubberId: s.id });
      points.push({ type: "element-end", position: s.left + s.width, scrubberId: s.id });
    }
    return points;
  }, [otherScrubbers]);

  const playheadSnapPoints = useMemo<SnapPoint[]>(() => {
    if (rulerPositionPx === undefined) return [];
    return [{ type: "playhead", position: rulerPositionPx }];
  }, [rulerPositionPx]);

  const allSnapPoints = useMemo<SnapPoint[]>(
    () => [...playheadSnapPoints, ...scrubberSnapPoints, ...gridSnapPoints],
    [playheadSnapPoints, scrubberSnapPoints, gridSnapPoints],
  );

  const snap = useCallback(
    (rawPx: number, excludeScrubberId?: string): SnapResult => {
      if (!enabled) return { snappedPx: rawPx, snapPoint: null };

      const filtered = excludeScrubberId
        ? allSnapPoints.filter((sp) => sp.scrubberId !== excludeScrubberId)
        : allSnapPoints;

      return resolveTimelineSnap(rawPx, filtered, threshold);
    },
    [enabled, allSnapPoints, threshold],
  );

  return { snap, threshold, allSnapPoints };
}
