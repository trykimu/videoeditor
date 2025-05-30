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
}

export interface MediaBinItem {
  id: string;
  mediaType: "video" | "image" | "text";
  mediaUrlLocal?: string;
  mediaUrlRemote?: string;
  name: string;
  durationInSeconds?: number; // For videos, to calculate initial width
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
  }[]
}

// Constants
export const PIXELS_PER_SECOND = 100;
export const DEFAULT_TRACK_HEIGHT = 60;
export const FPS = 30;
export const RULER_HEIGHT = 48; 