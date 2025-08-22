// because there is only a fixed set of tools the LLM can use in a video editor, we're going to be writing functions for those tools and then calling them from the LLM.

import { type MediaBinItem, type ScrubberState, type TimelineState, type TrackState, type TimelineDataItem, FPS } from "~/components/timeline/types";
import { generateUUID } from "./uuid";

// ============================
// TIMELINE OPERATIONS
// ============================

export function llmAddScrubberToTimeline(
  id: string, 
  mediaBinItems: MediaBinItem[], 
  track: string, 
  dropLeftPx: number, 
  handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void
) {
  // take a scrubber from the media bin and add it to the timeline. It is best to leave the import to media bin to the user.
  const scrubber = mediaBinItems.find(item => item.id === id);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${id} not found`);
  }
  handleDropOnTrack(scrubber, track, dropLeftPx);
}


// everything below is untested and written by claude

export function llmAddScrubberByName(
  name: string,
  mediaBinItems: MediaBinItem[],
  trackNumber: number,
  positionSeconds: number,
  pixelsPerSecond: number,
  handleDropOnTrack: (item: MediaBinItem, trackId: string, dropLeftPx: number) => void
) {
  const scrubber = mediaBinItems.find(item => 
    item.name.toLowerCase().includes(name.toLowerCase())
  );
  if (!scrubber) {
    throw new Error(`Media item with name "${name}" not found`);
  }
  const trackId = `track-${trackNumber}`;
  const dropLeftPx = positionSeconds * pixelsPerSecond;
  handleDropOnTrack(scrubber, trackId, dropLeftPx);
}

export function llmMoveScrubber(
  scrubberId: string,
  newPositionSeconds: number,
  newTrackNumber: number,
  pixelsPerSecond: number,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    left: newPositionSeconds * pixelsPerSecond,
    y: newTrackNumber - 1 // Convert to 0-based index
  };
  
  handleUpdateScrubber(updatedScrubber);
}

export function llmResizeScrubber(
  scrubberId: string,
  newDurationSeconds: number,
  pixelsPerSecond: number,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    width: newDurationSeconds * pixelsPerSecond
  };
  
  handleUpdateScrubber(updatedScrubber);
}

export function llmDeleteScrubber(
  scrubberId: string,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  // Find and remove scrubber by setting its width to 0 (effectively deleting it)
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${scrubberId} not found`);
  }
  
  // Remove by setting width to 0 or marking for deletion
  // Note: In a real implementation, you'd need a proper delete function
  throw new Error("Delete function needs to be implemented in the timeline hook");
}

export function llmDeleteScrubbersInTrack(
  trackNumber: number,
  timeline: TimelineState,
  handleDeleteScrubber: (scrubberId: string) => void
) {
  const trackIndex = trackNumber - 1;
  if (trackIndex < 0 || trackIndex >= timeline.tracks.length) {
    throw new Error(`Track ${trackNumber} does not exist`);
  }
  const track = timeline.tracks[trackIndex];
  // Delete all scrubbers in this track
  track.scrubbers.forEach((scrubber) => {
    handleDeleteScrubber(scrubber.id);
  });
}

// ============================
// TRACK OPERATIONS
// ============================

export function llmAddTrack(
  handleAddTrack: () => void
) {
  handleAddTrack();
}

export function llmDeleteTrack(
  trackId: string,
  handleDeleteTrack: (trackId: string) => void
) {
  handleDeleteTrack(trackId);
}

export function llmDeleteTrackByNumber(
  trackNumber: number,
  timeline: TimelineState,
  handleDeleteTrack: (trackId: string) => void
) {
  const trackIndex = trackNumber - 1; // Convert to 0-based index
  if (trackIndex < 0 || trackIndex >= timeline.tracks.length) {
    throw new Error(`Track ${trackNumber} does not exist`);
  }
  const trackId = timeline.tracks[trackIndex].id;
  handleDeleteTrack(trackId);
}

// ============================
// TIMELINE ZOOM & NAVIGATION
// ============================

export function llmZoomIn(
  handleZoomIn: () => void
) {
  handleZoomIn();
}

export function llmZoomOut(
  handleZoomOut: () => void
) {
  handleZoomOut();
}

export function llmZoomReset(
  handleZoomReset: () => void
) {
  handleZoomReset();
}

export function llmSetTimelinePosition(
  timeSeconds: number,
  pixelsPerSecond: number,
  handleRulerDrag: (positionPx: number) => void
) {
  const positionPx = timeSeconds * pixelsPerSecond;
  handleRulerDrag(positionPx);
}

// ============================
// PLAYBACK CONTROLS
// ============================

export function llmPlay(
  playerRef: React.RefObject<{ play: () => void } | null>
) {
  if (playerRef.current) {
    playerRef.current.play();
  } else {
    throw new Error("Player not available");
  }
}

export function llmPause(
  playerRef: React.RefObject<{ pause: () => void } | null>
) {
  if (playerRef.current) {
    playerRef.current.pause();
  } else {
    throw new Error("Player not available");
  }
}

export function llmTogglePlayback(
  togglePlayback: () => void
) {
  togglePlayback();
}

export function llmSeekToTime(
  timeSeconds: number,
  playerRef: React.RefObject<{ seekTo: (frame: number) => void } | null>
) {
  if (playerRef.current) {
    const frame = Math.round(timeSeconds * FPS);
    playerRef.current.seekTo(frame);
  } else {
    throw new Error("Player not available");
  }
}

export function llmSeekToFrame(
  frame: number,
  playerRef: React.RefObject<{ seekTo: (frame: number) => void } | null>
) {
  if (playerRef.current) {
    playerRef.current.seekTo(frame);
  } else {
    throw new Error("Player not available");
  }
}

// ============================
// MEDIA BIN OPERATIONS
// ============================

export function llmAddMediaFile(
  handleAddMediaClick: () => void
) {
  // Triggers file picker dialog
  handleAddMediaClick();
}

export function llmAddTextToMediaBin(
  textContent: string,
  fontSize: number = 48,
  fontFamily: string = "Arial",
  color: string = "#ffffff",
  textAlign: "left" | "center" | "right" = "center",
  fontWeight: "normal" | "bold" = "normal",
  handleAddTextToBin: (
    textContent: string,
    fontSize: number,
    fontFamily: string,
    color: string,
    textAlign: "left" | "center" | "right",
    fontWeight: "normal" | "bold"
  ) => void
) {
  handleAddTextToBin(textContent, fontSize, fontFamily, color, textAlign, fontWeight);
}

export function llmRemoveMediaFromBin(
  itemId: string,
  mediaBinItems: MediaBinItem[],
  setMediaBinItems: (items: MediaBinItem[]) => void
) {
  const filteredItems = mediaBinItems.filter(item => item.id !== itemId);
  setMediaBinItems(filteredItems);
}

export function llmGetMediaBinItem(
  itemName: string,
  mediaBinItems: MediaBinItem[]
): MediaBinItem | null {
  return mediaBinItems.find(item => 
    item.name.toLowerCase().includes(itemName.toLowerCase())
  ) || null;
}

export function llmListMediaBinItems(
  mediaBinItems: MediaBinItem[]
): string[] {
  return mediaBinItems.map(item => `${item.name} (${item.mediaType})`);
}

// ============================
// COMPOSITION SETTINGS
// ============================

export function llmSetResolution(
  width: number,
  height: number,
  handleWidthChange: (width: number) => void,
  handleHeightChange: (height: number) => void
) {
  handleWidthChange(width);
  handleHeightChange(height);
}

export function llmSetWidth(
  width: number,
  handleWidthChange: (width: number) => void
) {
  handleWidthChange(width);
}

export function llmSetHeight(
  height: number,
  handleHeightChange: (height: number) => void
) {
  handleHeightChange(height);
}

export function llmToggleAutoSize(
  handleAutoSizeChange: (auto: boolean) => void,
  currentState: boolean
) {
  handleAutoSizeChange(!currentState);
}

export function llmSetAutoSize(
  autoSize: boolean,
  handleAutoSizeChange: (auto: boolean) => void
) {
  handleAutoSizeChange(autoSize);
}

// ============================
// RENDERING OPERATIONS
// ============================

export function llmRenderVideo(
  handleRenderClick: () => void
) {
  handleRenderClick();
}

export function llmStartRender(
  getTimelineData: () => TimelineDataItem[],
  timeline: TimelineState,
  width: number | null,
  height: number | null,
  handleRenderVideo: (
    getTimelineData: () => TimelineDataItem[],
    timeline: TimelineState,
    width: number | null,
    height: number | null
  ) => void
) {
  handleRenderVideo(getTimelineData, timeline, width, height);
}

// ============================
// DEBUG & LOGGING
// ============================

export function llmLogTimelineData(
  handleLogTimelineData: () => void
) {
  handleLogTimelineData();
}

export function llmGetTimelineStats(
  timeline: TimelineState
): {
  trackCount: number;
  totalScrubbers: number;
  totalDuration: number;
  scrubbersByTrack: { [trackId: string]: number };
} {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  let maxEndTime = 0;
  
  allScrubbers.forEach(scrubber => {
    const endTime = (scrubber.left + scrubber.width) / 100; // Assuming 100 pixels per second
    if (endTime > maxEndTime) maxEndTime = endTime;
  });

  const scrubbersByTrack: { [trackId: string]: number } = {};
  timeline.tracks.forEach(track => {
    scrubbersByTrack[track.id] = track.scrubbers.length;
  });

  return {
    trackCount: timeline.tracks.length,
    totalScrubbers: allScrubbers.length,
    totalDuration: maxEndTime,
    scrubbersByTrack
  };
}

// ============================
// SCRUBBER PROPERTY EDITING
// ============================

export function llmUpdateScrubberInPlayer(
  scrubberId: string,
  properties: {
    left_player?: number;
    top_player?: number;
    width_player?: number;
    height_player?: number;
  },
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    ...properties
  };
  
  handleUpdateScrubber(updatedScrubber);
}

export function llmScaleScrubberInPlayer(
  scrubberId: string,
  scaleX: number,
  scaleY: number,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber) {
    throw new Error(`Scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    width_player: scrubber.width_player * scaleX,
    height_player: scrubber.height_player * scaleY
  };
  
  handleUpdateScrubber(updatedScrubber);
}

export function llmPositionScrubberInPlayer(
  scrubberId: string,
  x: number,
  y: number,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  llmUpdateScrubberInPlayer(
    scrubberId,
    { left_player: x, top_player: y },
    timeline,
    handleUpdateScrubber
  );
}

// ============================
// TEXT EDITING OPERATIONS
// ============================

export function llmUpdateTextContent(
  scrubberId: string,
  newTextContent: string,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber || scrubber.mediaType !== "text" || !scrubber.text) {
    throw new Error(`Text scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    name: newTextContent,
    text: {
      ...scrubber.text,
      textContent: newTextContent
    }
  };
  
  handleUpdateScrubber(updatedScrubber);
}

export function llmUpdateTextStyle(
  scrubberId: string,
  styleProperties: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    textAlign?: "left" | "center" | "right";
    fontWeight?: "normal" | "bold";
  },
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const scrubber = allScrubbers.find(s => s.id === scrubberId);
  if (!scrubber || scrubber.mediaType !== "text" || !scrubber.text) {
    throw new Error(`Text scrubber with id ${scrubberId} not found`);
  }
  
  const updatedScrubber: ScrubberState = {
    ...scrubber,
    text: {
      ...scrubber.text,
      ...styleProperties
    }
  };
  
  handleUpdateScrubber(updatedScrubber);
}

// ============================
// BULK OPERATIONS
// ============================

export function llmSelectAllScrubbers(
  timeline: TimelineState
): string[] {
  return timeline.tracks.flatMap(track => track.scrubbers).map(s => s.id);
}

export function llmSelectScrubbersByType(
  mediaType: "video" | "image" | "text",
  timeline: TimelineState
): string[] {
  return timeline.tracks
    .flatMap(track => track.scrubbers)
    .filter(s => s.mediaType === mediaType)
    .map(s => s.id);
}

export function llmMoveScrubbersByOffset(
  scrubberIds: string[],
  offsetSeconds: number,
  pixelsPerSecond: number,
  timeline: TimelineState,
  handleUpdateScrubber: (updatedScrubber: ScrubberState) => void
) {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  const offsetPx = offsetSeconds * pixelsPerSecond;
  
  scrubberIds.forEach(id => {
    const scrubber = allScrubbers.find(s => s.id === id);
    if (scrubber) {
      const updatedScrubber: ScrubberState = {
        ...scrubber,
        left: Math.max(0, scrubber.left + offsetPx)
      };
      handleUpdateScrubber(updatedScrubber);
    }
  });
}

// ============================
// UTILITY FUNCTIONS
// ============================

export function llmConvertTimeToPixels(
  timeSeconds: number,
  pixelsPerSecond: number
): number {
  return timeSeconds * pixelsPerSecond;
}

export function llmConvertPixelsToTime(
  pixels: number,
  pixelsPerSecond: number
): number {
  return pixels / pixelsPerSecond;
}

export function llmGetTimelineDuration(
  timeline: TimelineState,
  pixelsPerSecond: number
): number {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  let maxEndPosition = 0;
  
  allScrubbers.forEach(scrubber => {
    const endPosition = scrubber.left + scrubber.width;
    if (endPosition > maxEndPosition) {
      maxEndPosition = endPosition;
    }
  });
  
  return maxEndPosition / pixelsPerSecond;
}

export function llmFindScrubberByName(
  name: string,
  timeline: TimelineState
): ScrubberState | null {
  const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
  return allScrubbers.find(s => 
    s.name.toLowerCase().includes(name.toLowerCase())
  ) || null;
}

export function llmGetScrubberAtPosition(
  timeSeconds: number,
  trackNumber: number,
  pixelsPerSecond: number,
  timeline: TimelineState
): ScrubberState | null {
  const trackIndex = trackNumber - 1;
  if (trackIndex < 0 || trackIndex >= timeline.tracks.length) {
    return null;
  }
  
  const positionPx = timeSeconds * pixelsPerSecond;
  const track = timeline.tracks[trackIndex];
  
  return track.scrubbers.find(scrubber => 
    positionPx >= scrubber.left && positionPx <= scrubber.left + scrubber.width
  ) || null;
}

// ============================
// THEME & UI OPERATIONS
// ============================

export function llmToggleTheme(
  currentTheme: string,
  setTheme: (theme: string) => void
) {
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(newTheme);
}

export function llmSetTheme(
  theme: "light" | "dark",
  setTheme: (theme: string) => void
) {
  setTheme(theme);
}

// ============================
// NAVIGATION OPERATIONS
// ============================

export function llmNavigateToTextEditor(
  navigate: (path: string) => void
) {
  navigate("/editor/text-editor");
}

export function llmNavigateToMediaBin(
  navigate: (path: string) => void
) {
  navigate("/editor/media-bin");
}

export function llmNavigateHome(
  navigate: (path: string) => void
) {
  navigate("/");
}

// ============================
// VALIDATION FUNCTIONS
// ============================

export function llmValidateTimelineForRender(
  timeline: TimelineState
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (timeline.tracks.length === 0) {
    errors.push("No tracks in timeline");
  }
  
  const hasAnyContent = timeline.tracks.some(track => track.scrubbers.length > 0);
  if (!hasAnyContent) {
    errors.push("No media content in timeline");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function llmCheckForCollisions(
  timeline: TimelineState
): { hasCollisions: boolean; collisions: Array<{ scrubber1: string; scrubber2: string; track: string }> } {
  const collisions: Array<{ scrubber1: string; scrubber2: string; track: string }> = [];
  
  timeline.tracks.forEach(track => {
    const scrubbers = track.scrubbers;
    for (let i = 0; i < scrubbers.length; i++) {
      for (let j = i + 1; j < scrubbers.length; j++) {
        const s1 = scrubbers[i];
        const s2 = scrubbers[j];
        
        // Check if they overlap
        if (!(s1.left + s1.width <= s2.left || s2.left + s2.width <= s1.left)) {
          collisions.push({
            scrubber1: s1.id,
            scrubber2: s2.id,
            track: track.id
          });
        }
      }
    }
  });
  
  return {
    hasCollisions: collisions.length > 0,
    collisions
  };
}

