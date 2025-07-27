// base type for all scrubbers
export interface BaseScrubber {
  id: string;
  mediaType: "video" | "image" | "audio" | "text";
  mediaUrlLocal: string | null; // null for text
  mediaUrlRemote: string | null;
  media_width: number; // width of the media in pixels
  media_height: number; // height of the media in pixels
  text: TextProperties | null;

  // transitions are managed using the right transition id, as in what to add to the right. Convenient to think of. Left one is for the initial transition, first scrubber intro. we won't use it anywhere else.
  // for a middle transition, you will only see its information in the left scrubber.
  left_transition_id: string | null;  // only use this for the first scrubber intro
  right_transition_id: string | null; // this is what you use everywhere
}

export interface Transition {
  id: string;
  presentation: "fade" | "wipe" | "clockWipe" | "slide" | "flip" | "iris";
  timing: "spring" | "linear";
  durationInFrames: number;
  leftScrubberId: string | null;  // ID of the scrubber this transition starts from. null for the first scrubber in a track
  rightScrubberId: string | null; // ID of the scrubber this transition goes to. null for the last scrubber in a track
  // trackId: string;         // Track where this transition exists
}

export interface TextProperties {
  textContent: string; // Only present when mediaType is "text"
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: "left" | "center" | "right";
  fontWeight: "normal" | "bold";
}

// state of the scrubber in the media bin
export interface MediaBinItem extends BaseScrubber {
  name: string;
  durationInSeconds: number; // For media, to calculate initial width

  // Upload tracking properties
  uploadProgress: number | null; // 0-100, null when upload complete
  isUploading: boolean; // True while upload is in progress
}

// state of the scrubber in the timeline
export interface ScrubberState extends MediaBinItem {
  left: number; // in pixels (for the scrubber in the timeline)
  y: number; // track position (0-based index)
  width: number; // width is a css property for the scrubber width
  sourceMediaBinId: string; // ID of the media bin item this scrubber was created from

  // the following are the properties of the scrubber in <Player>
  left_player: number;
  top_player: number;
  width_player: number;
  height_player: number;
  is_dragging: boolean;

  // for video scrubbers (and audio in the future)
  trimBefore: number | null; // in frames
  trimAfter: number | null; // in frames
}

// state of the track in the timeline
export interface TrackState {
  id: string;
  scrubbers: ScrubberState[];
  transitions: Transition[];  // Transitions between scrubbers on this track
}

// state of the timeline
export interface TimelineState {
  tracks: TrackState[];
}

// the most important type. gets converted to json and gets rendered. Everything else is just a helper type. (formed using getTimelineData() in useTimeline.ts from timelinestate)
export interface TimelineDataItem {
  scrubbers: (BaseScrubber & {
    startTime: number;
    endTime: number;
    duration: number; // TODO: this should be calculated from the start and end time, for trimming, it should be done with the trimmer. This should be refactored later.
    trackIndex: number; // track index in the timeline

    // the following are the properties of the scrubber in <Player>
    left_player: number;
    top_player: number;
    width_player: number;
    height_player: number;

    // for video scrubbers (and audio in the future)
    trimBefore: number | null; // in frames
    trimAfter: number | null; // in frames
  })[];
  transitions: { [id: string]: Transition };
}

// Constants
export const PIXELS_PER_SECOND = 100;
export const DEFAULT_TRACK_HEIGHT = 60;
export const FPS = 30;
export const RULER_HEIGHT = 32;

// Zoom constants
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const DEFAULT_ZOOM = 1;
