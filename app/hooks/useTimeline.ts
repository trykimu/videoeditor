import { useState, useCallback, useEffect } from "react";
import {
  PIXELS_PER_SECOND,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  type TimelineState,
  type TrackState,
  type ScrubberState,
  type MediaBinItem,
  type TimelineDataItem,
  FPS,
} from "../components/timeline/types";
import { generateUUID } from "../utils/uuid";

export const useTimeline = () => {
  const [timeline, setTimeline] = useState<TimelineState>({
    // id: "main",
    tracks: [
      {
        id: "track-1",
        scrubbers: [],
      },
      {
        id: "track-2",
        scrubbers: [],
      },
      {
        id: "track-3",
        scrubbers: [],
      },
    ],
  });

  const [timelineWidth, setTimelineWidth] = useState(2000);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);

  const EXPANSION_THRESHOLD = 200;
  const EXPANSION_AMOUNT = 1000;

  // Get zoomed pixels per second
  const getPixelsPerSecond = useCallback(() => {
    return PIXELS_PER_SECOND * zoomLevel;
  }, [zoomLevel]);

  // Zoom functions that update scrubber positions and widths accordingly
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(MAX_ZOOM, prev * 1.5);
      const zoomRatio = newZoom / prev;

      // Update all scrubbers to maintain their time positions
      setTimeline((currentTimeline) => ({
        ...currentTimeline,
        tracks: currentTimeline.tracks.map((track) => ({
          ...track,
          scrubbers: track.scrubbers.map((scrubber) => ({
            ...scrubber,
            left: scrubber.left * zoomRatio,
            width: scrubber.width * zoomRatio,
          })),
        })),
      }));

      return newZoom;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(MIN_ZOOM, prev / 1.5);
      const zoomRatio = newZoom / prev;

      // Update all scrubbers to maintain their time positions
      setTimeline((currentTimeline) => ({
        ...currentTimeline,
        tracks: currentTimeline.tracks.map((track) => ({
          ...track,
          scrubbers: track.scrubbers.map((scrubber) => ({
            ...scrubber,
            left: scrubber.left * zoomRatio,
            width: scrubber.width * zoomRatio,
          })),
        })),
      }));

      return newZoom;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = DEFAULT_ZOOM;
      const zoomRatio = newZoom / prev;

      // Update all scrubbers to maintain their time positions
      setTimeline((currentTimeline) => ({
        ...currentTimeline,
        tracks: currentTimeline.tracks.map((track) => ({
          ...track,
          scrubbers: track.scrubbers.map((scrubber) => ({
            ...scrubber,
            left: scrubber.left * zoomRatio,
            width: scrubber.width * zoomRatio,
          })),
        })),
      }));

      return newZoom;
    });
  }, []);

  // TODO: remove this after testing
  // useEffect(() => {
  //   console.log('timeline meoeoeo', JSON.stringify(timeline, null, 2))
  // }, [timeline])

  const getTimelineData = useCallback((): TimelineDataItem[] => {
    const pixelsPerSecond = getPixelsPerSecond();
    const timelineData = [
      {
        // id: timeline.id,
        // totalDuration: timelineWidth / pixelsPerSecond,
        scrubbers: timeline.tracks.flatMap((track) =>
          track.scrubbers.map((scrubber) => ({
            id: scrubber.id,
            mediaType: scrubber.mediaType,
            mediaUrlLocal: scrubber.mediaUrlLocal,
            mediaUrlRemote: scrubber.mediaUrlRemote,
            width: scrubber.width,
            startTime: scrubber.left / pixelsPerSecond,
            endTime: (scrubber.left + scrubber.width) / pixelsPerSecond,
            duration: scrubber.width / pixelsPerSecond,
            trackId: track.id,
            trackIndex: scrubber.y || 0,
            media_width: scrubber.media_width,
            media_height: scrubber.media_height,
            text: scrubber.text,

            // the following are the properties of the scrubber in <Player>
            left_player: scrubber.left_player,
            top_player: scrubber.top_player,
            width_player: scrubber.width_player,
            height_player: scrubber.height_player,

            // for video scrubbers (and audio in the future)
            trimBefore: scrubber.trimBefore,
            trimAfter: scrubber.trimAfter,
          }))
        ),
      },
    ];

    // console.log('bahahh', JSON.stringify(timelineData, null, 2));

    return timelineData;
  }, [timeline, getPixelsPerSecond]);

  const expandTimeline = useCallback(
    (containerRef: React.RefObject<HTMLDivElement | null>) => {
      if (!containerRef.current) return false;

      const containerWidth = containerRef.current.offsetWidth;
      const currentScrollLeft = containerRef.current.scrollLeft;
      const scrollRight = currentScrollLeft + containerWidth;
      const distanceToEnd = timelineWidth - scrollRight;

      if (distanceToEnd < EXPANSION_THRESHOLD) {
        setTimelineWidth((prev) => prev + EXPANSION_AMOUNT);
        return true;
      }
      return false;
    },
    [timelineWidth]
  );

  const handleAddTrack = useCallback(() => {
    const newTrack: TrackState = {
      id: generateUUID(),
      scrubbers: [],
    };
    setTimeline((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  }, []);

  const handleDeleteTrack = useCallback((trackId: string) => {
    setTimeline((prev) => ({
      tracks: prev.tracks.filter((t) => t.id !== trackId),
    }));
  }, []);

  const getAllScrubbers = useCallback(() => {
    return timeline.tracks.flatMap((track) => track.scrubbers);
  }, [timeline]);

  const handleUpdateScrubber = useCallback((updatedScrubber: ScrubberState) => {
    setTimeline((prev) => {
      // Find current track index of the scrubber
      const currentTrackIndex = prev.tracks.findIndex(track =>
        track.scrubbers.some(scrubber => scrubber.id === updatedScrubber.id)
      );

      const newTrackIndex = updatedScrubber.y || 0;

      // If track hasn't changed, just update in place
      if (currentTrackIndex === newTrackIndex) {
        return {
          ...prev,
          tracks: prev.tracks.map((track) => ({
            ...track,
            scrubbers: track.scrubbers.map((scrubber) =>
              scrubber.id === updatedScrubber.id ? updatedScrubber : scrubber
            ),
          })),
        };
      }

      // Track changed - remove from old track and add to new track
      return {
        ...prev,
        tracks: prev.tracks.map((track, index) => {
          if (index === currentTrackIndex) {
            // Remove from current track
            return {
              ...track,
              scrubbers: track.scrubbers.filter(scrubber => scrubber.id !== updatedScrubber.id)
            };
          } else if (index === newTrackIndex) {
            // Add to new track
            return {
              ...track,
              scrubbers: [...track.scrubbers, updatedScrubber]
            };
          }
          return track;
        }),
      };
    });
  }, []);

  const handleDeleteScrubber = useCallback((scrubberId: string) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        scrubbers: track.scrubbers.filter(
          (scrubber) => scrubber.id !== scrubberId
        ),
      })),
    }));
  }, []);

  const handleDeleteScrubbersByMediaBinId = useCallback((mediaBinId: string) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        scrubbers: track.scrubbers.filter(
          (scrubber) => scrubber.sourceMediaBinId !== mediaBinId
        ),
      })),
    }));
  }, []);

  const handleAddScrubberToTrack = useCallback(
    (trackId: string, newScrubber: ScrubberState) => {
      console.log("Adding scrubber to track", trackId, newScrubber);
      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) =>
          track.id === trackId
            ? { ...track, scrubbers: [...track.scrubbers, newScrubber] }
            : track
        ),
      }));
    },
    []
  );

  const handleDropOnTrack = useCallback(
    (item: MediaBinItem, trackId: string, dropLeftPx: number) => {
      console.log(
        "Dropped",
        item.name,
        "on track",
        trackId,
        "at",
        dropLeftPx,
        "px"
      );

      const pixelsPerSecond = getPixelsPerSecond();
      let widthPx = item.mediaType === "text" ? 80 : 150;
      if ((item.mediaType === "video" || item.mediaType === "audio") && item.durationInSeconds) {
        widthPx = item.durationInSeconds * pixelsPerSecond;
      } else if (item.mediaType === "image") {
        widthPx = 100;
      }
      widthPx = Math.max(20, widthPx);

      const targetTrackIndex = timeline.tracks.findIndex(
        (t) => t.id === trackId
      );
      if (targetTrackIndex === -1) return;

      // For text elements, provide default dimensions if they're 0
      const playerWidth =
        item.mediaType === "text" && item.media_width === 0
          ? Math.max(
            200,
            (item.text?.textContent?.length || 10) *
            (item.text?.fontSize || 48) *
            0.6
          )
          : item.media_width;
      const playerHeight =
        item.mediaType === "text" && item.media_height === 0
          ? Math.max(80, (item.text?.fontSize || 48) * 1.5)
          : item.media_height;

      const newScrubber: ScrubberState = {
        id: generateUUID(),
        left: dropLeftPx,
        width: widthPx,
        mediaType: item.mediaType,
        mediaUrlLocal: item.mediaUrlLocal,
        mediaUrlRemote: item.mediaUrlRemote,
        y: targetTrackIndex,
        name: item.name,
        durationInSeconds: item.durationInSeconds,
        media_width: item.media_width,
        media_height: item.media_height,
        text: item.text,
        sourceMediaBinId: item.id,

        // the following are the properties of the scrubber in <Player>
        left_player: 100, // default values TODO: maybe move it to the center of the <Player> initially
        top_player: 100,
        width_player: playerWidth,
        height_player: playerHeight,
        is_dragging: false,

        // upload tracking properties
        uploadProgress: item.uploadProgress,
        isUploading: item.isUploading,

        // for video scrubbers (and audio in the future)
        trimBefore: null,
        trimAfter: null,
      };

      handleAddScrubberToTrack(trackId, newScrubber);
    },
    [timeline.tracks, handleAddScrubberToTrack, getPixelsPerSecond]
  );

  const handleSplitScrubberAtRuler = useCallback((rulerPositionPx: number, selectedScrubberId: string | null) => {
    if (!selectedScrubberId) {
      return 0; // No scrubber selected
    }

    const pixelsPerSecond = getPixelsPerSecond();
    const splitTimeInSeconds = rulerPositionPx / pixelsPerSecond;

    // Find the selected scrubber
    const allScrubbers = timeline.tracks.flatMap(track => track.scrubbers);
    const selectedScrubber = allScrubbers.find(scrubber => scrubber.id === selectedScrubberId);

    if (!selectedScrubber) {
      return 0; // Selected scrubber not found
    }

    const startTime = selectedScrubber.left / pixelsPerSecond;
    const endTime = (selectedScrubber.left + selectedScrubber.width) / pixelsPerSecond;

    // Check if split time is within the selected scrubber (excluding edges)
    if (splitTimeInSeconds <= startTime || splitTimeInSeconds >= endTime) {
      return 0; // Split time is not within the selected scrubber
    }

    const scrubberDuration = endTime - startTime;
    const splitOffsetTime = splitTimeInSeconds - startTime;

    // Calculate current trim values
    const currentTrimBefore = selectedScrubber.trimBefore || 0;
    const currentTrimAfter = selectedScrubber.trimAfter || 0;

    // Calculate split point in original media frames
    const splitFrameOffset = Math.round(splitOffsetTime * FPS);
    const splitFrameInOriginal = currentTrimBefore + splitFrameOffset;

    // Calculate the original media duration in frames
    // If we have durationInSeconds, use it; otherwise estimate from current trim + displayed duration
    const displayedDurationFrames = Math.round(scrubberDuration * FPS);
    const originalDurationFrames = selectedScrubber.durationInSeconds
      ? Math.round(selectedScrubber.durationInSeconds * FPS)
      : currentTrimBefore + displayedDurationFrames + currentTrimAfter;

    // Create first scrubber (from start to split point)
    const firstScrubber: ScrubberState = {
      ...selectedScrubber,
      id: generateUUID(),
      width: splitOffsetTime * pixelsPerSecond,
      trimBefore: currentTrimBefore,
      trimAfter: originalDurationFrames - splitFrameInOriginal,
    };

    // Create second scrubber (from split point to end)  
    const secondScrubber: ScrubberState = {
      ...selectedScrubber,
      id: generateUUID(),
      left: selectedScrubber.left + splitOffsetTime * pixelsPerSecond,
      width: (scrubberDuration - splitOffsetTime) * pixelsPerSecond,
      trimBefore: splitFrameInOriginal,
      trimAfter: currentTrimAfter,
    };

    // Apply the replacement in a single state update
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        scrubbers: track.scrubbers.flatMap(scrubber => {
          if (scrubber.id === selectedScrubberId) {
            return [firstScrubber, secondScrubber];
          }
          return [scrubber];
        })
      }))
    }));

    return 1; // One scrubber was split
  }, [timeline, getPixelsPerSecond]);

  return {
    timeline,
    timelineWidth,
    zoomLevel,
    getPixelsPerSecond,
    getTimelineData,
    expandTimeline,
    handleAddTrack,
    handleDeleteTrack,
    getAllScrubbers,
    handleUpdateScrubber,
    handleDeleteScrubber,
    handleDeleteScrubbersByMediaBinId,
    handleAddScrubberToTrack,
    handleDropOnTrack,
    handleSplitScrubberAtRuler,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  };
};
