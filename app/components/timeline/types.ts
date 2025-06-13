// base type for all scrubbers
export interface BaseScrubber {
  id: string;
  mediaType: "video" | "image" | "text";
  mediaUrlLocal: string | null;   // null for text
  mediaUrlRemote: string | null;
  media_width: number; // width of the media in pixels
  media_height: number; // height of the media in pixels
  text: TextProperties | null;
}

export interface TextProperties {
  textContent: string;  // Only present when mediaType is "text"
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  fontWeight: 'normal' | 'bold';
}

// state of the scrubber in the media bin
export interface MediaBinItem extends BaseScrubber {
  name: string;
  durationInSeconds: number; // For media, to calculate initial width
}

// state of the scrubber in the timeline
export interface ScrubberState extends MediaBinItem {
  left: number; // in pixels
  y: number; // track position (0-based index)
  width: number;          // width is a css property for the scrubber width
}

// state of the track in the timeline
export interface TrackState {
  id: string;
  scrubbers: ScrubberState[];
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
  })[];
}

// Constants
export const PIXELS_PER_SECOND = 100;
export const DEFAULT_TRACK_HEIGHT = 60;
export const FPS = 30;
export const RULER_HEIGHT = 48; 