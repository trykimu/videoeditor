import { useState, useCallback, useEffect } from "react"
import { PIXELS_PER_SECOND, type TimelineState, type TrackState, type ScrubberState, type MediaBinItem, type TimelineDataItem } from "../components/timeline/types"
import { generateUUID } from "../utils/uuid"

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
  })
  
  const [timelineWidth, setTimelineWidth] = useState(2000)

  const EXPANSION_THRESHOLD = 200
  const EXPANSION_AMOUNT = 1000

  // TODO: remove this after testing
  // useEffect(() => {
  //   console.log('timeline meoeoeo', JSON.stringify(timeline, null, 2))
  // }, [timeline])

  const getTimelineData = useCallback((): TimelineDataItem[] => {
    const timelineData = [{
      // id: timeline.id,
      // totalDuration: timelineWidth / PIXELS_PER_SECOND,
      scrubbers: timeline.tracks.flatMap(track =>
        track.scrubbers.map(scrubber => ({
          id: scrubber.id,
          mediaType: scrubber.mediaType,
          mediaUrlLocal: scrubber.mediaUrlLocal,
          mediaUrlRemote: scrubber.mediaUrlRemote,
          width: scrubber.width,
          startTime: scrubber.left / PIXELS_PER_SECOND,
          endTime: (scrubber.left + scrubber.width) / PIXELS_PER_SECOND,
          duration: scrubber.width / PIXELS_PER_SECOND,
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
      )
    }]

    // console.log('bahahh', JSON.stringify(timelineData, null, 2));

    return timelineData
  }, [timeline])

  const expandTimeline = useCallback((containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current) return false

    const containerWidth = containerRef.current.offsetWidth
    const currentScrollLeft = containerRef.current.scrollLeft
    const scrollRight = currentScrollLeft + containerWidth
    const distanceToEnd = timelineWidth - scrollRight

    if (distanceToEnd < EXPANSION_THRESHOLD) {
      setTimelineWidth((prev) => prev + EXPANSION_AMOUNT)
      return true
    }
    return false
  }, [timelineWidth])

  const handleAddTrack = useCallback(() => {
    const newTrack: TrackState = {
      id: generateUUID(),
      scrubbers: [],
    }
    setTimeline((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }))
  }, [])

  const handleDeleteTrack = useCallback((trackId: string) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.filter((t) => t.id !== trackId)
    }))
  }, [])

  const getAllScrubbers = useCallback(() => {
    return timeline.tracks.flatMap(track => track.scrubbers)
  }, [timeline])

  const handleUpdateScrubber = useCallback((updatedScrubber: ScrubberState) => {
    // console.log(
    //   'updatedScrubber handlescrubber',
    //   JSON.stringify(updatedScrubber, null, 2)
    // );
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        scrubbers: track.scrubbers.map(scrubber =>
          scrubber.id === updatedScrubber.id ? updatedScrubber : scrubber
        )
      }))
    }))
  }, [])

  const handleAddScrubberToTrack = useCallback((trackId: string, newScrubber: ScrubberState) => {
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, scrubbers: [...track.scrubbers, newScrubber] }
          : track
      )
    }))
  }, [])

  const handleDropOnTrack = useCallback((item: MediaBinItem, trackId: string, dropLeftPx: number) => {
    console.log("Dropped", item.name, "on track", trackId, "at", dropLeftPx, "px");

    let widthPx = item.mediaType === "text" ? 80 : 150;
    if (item.mediaType === "video" && item.durationInSeconds) {
      widthPx = item.durationInSeconds * PIXELS_PER_SECOND;
    } else if (item.mediaType === "image") {
      widthPx = 100;
    }
    widthPx = Math.max(20, widthPx);

    const targetTrackIndex = timeline.tracks.findIndex(t => t.id === trackId);
    if (targetTrackIndex === -1) return;

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
      left_player: 100,       // default values TODO: maybe move it to the center of the <Player> initially
      top_player: 100,
      width_player: item.media_width,
      height_player: item.media_height,
      is_dragging: false,
    };

    handleAddScrubberToTrack(trackId, newScrubber);
  }, [timeline.tracks, handleAddScrubberToTrack])

  return {
    timeline,
    timelineWidth,
    getTimelineData,
    expandTimeline,
    handleAddTrack,
    handleDeleteTrack,
    getAllScrubbers,
    handleUpdateScrubber,
    handleAddScrubberToTrack,
    handleDropOnTrack,
  }
} 