import type { TimelineState, TrackState } from "~/components/timeline/types";

/** Strip session-only fields before persisting to the server. */
export function timelineStateForPersistence(timeline: TimelineState): TimelineState {
  return {
    tracks: timeline.tracks.map((track) => {
      const { hidden: _hidden, ...rest } = track as TrackState & { hidden?: boolean };
      return rest;
    }),
  };
}
