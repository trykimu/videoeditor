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
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== trackId),
    }));
  }, []);

  const getAllScrubbers = useCallback(() => {
    return timeline.tracks.flatMap((track) => track.scrubbers);
  }, [timeline]);

  const handleUpdateScrubber = useCallback((updatedScrubber: ScrubberState) => {
    // console.log(
    //   'updatedScrubber handlescrubber',
    //   JSON.stringify(updatedScrubber, null, 2)
    // );
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        scrubbers: track.scrubbers.map((scrubber) =>
          scrubber.id === updatedScrubber.id ? updatedScrubber : scrubber
        ),
      })),
    }));
  }, []);

  const handleAddScrubberToTrack = useCallback(
    (trackId: string, newScrubber: ScrubberState) => {
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
      if (item.mediaType === "video" && item.durationInSeconds) {
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

        // the following are the properties of the scrubber in <Player>
        left_player: 100, // default values TODO: maybe move it to the center of the <Player> initially
        top_player: 100,
        width_player: playerWidth,
        height_player: playerHeight,
        is_dragging: false,
      };

      handleAddScrubberToTrack(trackId, newScrubber);
    },
    [timeline.tracks, handleAddScrubberToTrack, getPixelsPerSecond]
  );

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
    handleAddScrubberToTrack,
    handleDropOnTrack,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  };
};
