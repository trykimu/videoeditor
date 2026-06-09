import {
  DEFAULT_TRACK_HEIGHT,
  KEYFRAME_LANE_HEIGHT,
  type ScrubberState,
  type TrackState,
} from "../types";

export function sortScrubbersOnTrack(track: TrackState): ScrubberState[] {
  return [...track.scrubbers].sort((a, b) => a.left - b.left || a.id.localeCompare(b.id));
}

export function getKeyframeLaneCount(scrubber: ScrubberState, expandedIds: Set<string>): number {
  if (!expandedIds.has(scrubber.id)) return 0;
  const count = scrubber.keyframes?.tracks.length ?? 0;
  return Math.max(1, count);
}

/** Y offset from the top of a track row to this scrubber's keyframe block. */
export function getKeyframeBlockTopWithinTrack(
  scrubber: ScrubberState,
  track: TrackState,
  expandedIds: Set<string>,
): number {
  let top = DEFAULT_TRACK_HEIGHT;
  for (const s of sortScrubbersOnTrack(track)) {
    if (s.id === scrubber.id) return top;
    if (expandedIds.has(s.id)) {
      top += getKeyframeLaneCount(s, expandedIds) * KEYFRAME_LANE_HEIGHT;
    }
  }
  return top;
}

export function isTrackVisible(track: TrackState): boolean {
  return !track.hidden;
}

export function findTrackForScrubber(
  tracks: TrackState[],
  scrubberId: string,
): { track: TrackState; trackIndex: number } | null {
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].scrubbers.some((s) => s.id === scrubberId)) {
      return { track: tracks[i], trackIndex: i };
    }
  }
  return null;
}

export function getScrubberClipBounds(
  scrubber: ScrubberState,
  trackTopPx: number,
): { left: number; top: number; width: number; height: number } {
  return {
    left: scrubber.left,
    top: trackTopPx + 2,
    width: scrubber.width,
    height: DEFAULT_TRACK_HEIGHT - 4,
  };
}
