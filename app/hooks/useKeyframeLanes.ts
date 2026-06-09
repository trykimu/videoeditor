import { useState, useCallback } from "react";
import { KEYFRAME_LANE_HEIGHT, DEFAULT_TRACK_HEIGHT } from "~/components/timeline/types";
import type { TrackState } from "~/components/timeline/types";

export function useKeyframeLanes() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleKeyframeLanes = useCallback((scrubberId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(scrubberId)) {
        next.delete(scrubberId);
      } else {
        next.add(scrubberId);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (scrubberId: string) => expandedIds.has(scrubberId),
    [expandedIds],
  );

  // Returns the total visual height for a track row (base + expanded keyframe lanes)
  const getTrackVisualHeight = useCallback(
    (track: TrackState): number => {
      let extra = 0;
      for (const s of track.scrubbers) {
        if (expandedIds.has(s.id)) {
          const laneCount = s.keyframes?.tracks.length ?? 0;
          extra += Math.max(1, laneCount) * KEYFRAME_LANE_HEIGHT;
        }
      }
      return DEFAULT_TRACK_HEIGHT + extra;
    },
    [expandedIds],
  );

  // Compute the correct track index from a Y pixel coordinate (accounting for expanded lanes)
  const getTrackIndexFromY = useCallback(
    (y: number, tracks: TrackState[]): number => {
      let cumulative = 0;
      for (let i = 0; i < tracks.length; i++) {
        const h = getTrackVisualHeight(tracks[i]);
        if (y < cumulative + h) return i;
        cumulative += h;
      }
      return tracks.length - 1;
    },
    [getTrackVisualHeight],
  );

  return {
    expandedIds,
    toggleKeyframeLanes,
    isExpanded,
    getTrackVisualHeight,
    getTrackIndexFromY,
  };
}
