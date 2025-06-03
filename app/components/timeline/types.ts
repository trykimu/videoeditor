import type { PlayerRef } from "@remotion/player"

export interface ScrubberState {
  id: string
  left: number // in pixels
  width: number // in pixels
  mediaType: "video" | "image" | "text"
  mediaUrlLocal?: string
  mediaUrlRemote?: string
  y?: number // track position (0-based index)
  name?: string // Added for displaying a name
  durationInSeconds?: number // Added for original video duration
  media_width: number | null;
  media_height: number | null;
}

export interface MediaBinItem {
  id: string;
  mediaType: "video" | "image" | "text";
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  name: string;
  durationInSeconds?: number; // For videos, to calculate initial width
  media_width: number | null;
  media_height: number | null;
}

export interface TrackState {
  id: string
  scrubbers: ScrubberState[]
}

export interface TimelineState {
  id: string
  tracks: TrackState[]
}

export interface SnapConfig {
  enabled: boolean
  distance: number // snap distance in pixels
}

export interface ScrubberProps {
  scrubber: ScrubberState
  timelineWidth: number
  otherScrubbers: ScrubberState[]
  onUpdate: (updatedScrubber: ScrubberState) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  expandTimeline: () => boolean
  snapConfig: SnapConfig
  trackCount: number
}

export type TimelineScrubber = {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  mediaType: 'image' | 'video' | 'text';
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  width: number;
  media_width: number;
  media_height: number;
}

export type TimelineData = {
  id: string;
  totalDuration: number;
  scrubbers: TimelineScrubber[];
}

export type VideoPlayerProps = {
  timelineData: TimelineDataItem[];
  durationInFrames: number;
  ref?: React.Ref<PlayerRef>;
  compositionWidth: number | null;    // if null, the player width = max(width)
  compositionHeight: number | null;   // if null, the player height = max(height)
}

export interface TimelineDataItem {
  id: string
  totalDuration: number
  scrubbers: {
    id: string
    mediaType: "video" | "image" | "text"
    mediaUrlLocal?: string
    mediaUrlRemote?: string
    width: number
    startTime: number
    endTime: number
    duration: number
    trackId: string
    trackIndex: number
    media_width: number | null
    media_height: number | null
  }[]
}

// Constants
export const PIXELS_PER_SECOND = 100;
export const DEFAULT_TRACK_HEIGHT = 60;
export const FPS = 30;
export const RULER_HEIGHT = 48; 