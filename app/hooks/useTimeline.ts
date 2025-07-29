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
  type Transition,
  FPS,
} from "../components/timeline/types";
import { generateUUID } from "../utils/uuid";
import { toast } from "sonner";

export const useTimeline = () => {
  const [timeline, setTimeline] = useState<TimelineState>({
    // id: "main",
    tracks: [
      {
        id: "track-1",
        scrubbers: [],
        transitions: [],
      },
      {
        id: "track-2",
        scrubbers: [],
        transitions: [],
      },
      {
        id: "track-3",
        scrubbers: [],
        transitions: [],
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

    const scrubbers = [];
    for (const track of timeline.tracks) {
      for (const scrubber of track.scrubbers) {
        scrubbers.push({
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

          left_transition_id: scrubber.left_transition_id,
          right_transition_id: scrubber.right_transition_id,
        });
      }
    }

    const transitions: { [id: string]: Transition } = {};
    for (const track of timeline.tracks) {
      for (const transition of track.transitions) {
        transitions[transition.id] = {
          id: transition.id,
          presentation: transition.presentation,
          timing: transition.timing,
          durationInFrames: transition.durationInFrames,
          leftScrubberId: transition.leftScrubberId,
          rightScrubberId: transition.rightScrubberId,
        };
      }
    }

    const timelineData = [
      {
        // id: timeline.id,
        // totalDuration: timelineWidth / pixelsPerSecond,
        scrubbers: scrubbers,
        transitions: transitions,
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
      transitions: [],
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

        left_transition_id: null,
        right_transition_id: null,
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

  // Transition management functions
  const validateTransitionPlacement = useCallback((
    leftScrubberId: string | null,
    rightScrubberId: string | null,
    transition: Transition,
    trackId: string
  ): { valid: boolean; error?: string } => {
    const track = timeline.tracks.find(t => t.id === trackId);
    if (!track) return { valid: false, error: "Track not found" };

    // Get scrubbers
    const leftScrubber = leftScrubberId ? track.scrubbers.find(s => s.id === leftScrubberId) : null;
    const rightScrubber = rightScrubberId ? track.scrubbers.find(s => s.id === rightScrubberId) : null;

    // Rule 1: Transition can't be longer than adjacent sequences
    if (leftScrubber) {
      const leftDuration = (leftScrubber.width / getPixelsPerSecond()) * FPS;
      if (transition.durationInFrames > leftDuration) {
        return { valid: false, error: "Transition is longer than the previous sequence" };
      }
    }

    if (rightScrubber) {
      const rightDuration = (rightScrubber.width / getPixelsPerSecond()) * FPS;
      if (transition.durationInFrames > rightDuration) {
        return { valid: false, error: "Transition is longer than the next sequence" };
      }
    }

    // Rule 2: No two transitions next to each other
    if (leftScrubber?.right_transition_id && rightScrubber?.left_transition_id) {
      return { valid: false, error: "Cannot place transitions next to each other" };
    }

    // Rule 3: Must have at least one sequence before or after
    if (!leftScrubber && !rightScrubber) {
      return { valid: false, error: "Must have at least one sequence before or after a transition" };
    }

    return { valid: true };
  }, [timeline, getPixelsPerSecond]);

  const getConnectedElements = useCallback((elementId: string): string[] => {
    const connected = new Set<string>();
    const toProcess = [elementId];
    
    while (toProcess.length > 0) {
      const currentId = toProcess.pop()!;
      if (connected.has(currentId)) continue;
      connected.add(currentId);

      // Find all scrubbers and transitions connected to this element
      for (const track of timeline.tracks) {
        // Check scrubbers
        for (const scrubber of track.scrubbers) {
          if (scrubber.id === currentId) {
            if (scrubber.left_transition_id && !connected.has(scrubber.left_transition_id)) {
              toProcess.push(scrubber.left_transition_id);
            }
            if (scrubber.right_transition_id && !connected.has(scrubber.right_transition_id)) {
              toProcess.push(scrubber.right_transition_id);
            }
          }
        }

        // Check transitions
        for (const transition of track.transitions) {
          if (transition.id === currentId) {
            if (transition.leftScrubberId && !connected.has(transition.leftScrubberId)) {
              toProcess.push(transition.leftScrubberId);
            }
            if (transition.rightScrubberId && !connected.has(transition.rightScrubberId)) {
              toProcess.push(transition.rightScrubberId);
            }
          }
        }
      }
    }

    return Array.from(connected);
  }, [timeline]);

  const handleAddTransitionToTrack = useCallback((
    trackId: string,
    transition: Transition,
    dropPosition: number
  ) => {
    const track = timeline.tracks.find(t => t.id === trackId);
    if (!track) {
      toast.error("Track not found");
      return;
    }

    // Find scrubbers at or near the drop position
    const scrubbers = track.scrubbers
      .filter(s => s.y === timeline.tracks.findIndex(t => t.id === trackId))
      .sort((a, b) => a.left - b.left);

    let leftScrubber: ScrubberState | null = null;
    let rightScrubber: ScrubberState | null = null;

    // Find the scrubbers that the transition should be between
    for (let i = 0; i < scrubbers.length; i++) {
      const scrubber = scrubbers[i];
      const scrubberEnd = scrubber.left + scrubber.width;

      if (dropPosition >= scrubber.left && dropPosition <= scrubberEnd) {
        // Dropped on a scrubber
        if (dropPosition <= scrubber.left + scrubber.width / 2) {
          // Closer to left edge
          leftScrubber = scrubbers[i - 1] || null;
          rightScrubber = scrubber;
        } else {
          // Closer to right edge
          leftScrubber = scrubber;
          rightScrubber = scrubbers[i + 1] || null;
        }
        break;
      } else if (i === 0 && dropPosition < scrubber.left) {
        // Before first scrubber
        rightScrubber = scrubber;
        break;
      } else if (i === scrubbers.length - 1 && dropPosition > scrubberEnd) {
        // After last scrubber
        leftScrubber = scrubber;
        break;
      } else if (i < scrubbers.length - 1) {
        const nextScrubber = scrubbers[i + 1];
        if (dropPosition > scrubberEnd && dropPosition < nextScrubber.left) {
          // Between two scrubbers
          leftScrubber = scrubber;
          rightScrubber = nextScrubber;
          break;
        }
      }
    }

    // Validate audio scrubbers
    if (leftScrubber?.mediaType === "audio" || rightScrubber?.mediaType === "audio") {
      toast.error("Audio scrubbers cannot have transitions");
      return;
    }

    // Update transition with scrubber IDs
    const updatedTransition: Transition = {
      ...transition,
      leftScrubberId: leftScrubber?.id || null,
      rightScrubberId: rightScrubber?.id || null,
    };

    // Validate placement
    const validation = validateTransitionPlacement(
      leftScrubber?.id || null,
      rightScrubber?.id || null,
      updatedTransition,
      trackId
    );

    if (!validation.valid) {
      toast.error(validation.error || "Invalid transition placement");
      return;
    }

    // Calculate the overlap distance needed for the transition
    const pixelsPerSecond = getPixelsPerSecond();
    const transitionWidthPx = (updatedTransition.durationInFrames / 30) * pixelsPerSecond;

    // Add transition to track and update scrubber references with overlap positioning
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id !== trackId) return track;

        return {
          ...track,
          transitions: [...track.transitions, updatedTransition],
          scrubbers: track.scrubbers.map(scrubber => {
            if (scrubber.id === leftScrubber?.id) {
              return { ...scrubber, right_transition_id: updatedTransition.id };
            }
            if (scrubber.id === rightScrubber?.id) {
              // Move the right scrubber to create overlap
              // The right scrubber should start at (leftScrubber.end - transitionWidth)
              const newLeft = leftScrubber ? (leftScrubber.left + leftScrubber.width - transitionWidthPx) : scrubber.left;
              return { 
                ...scrubber, 
                left: newLeft,
                left_transition_id: updatedTransition.id 
              };
            }
            return scrubber;
          })
        };
      })
    }));

    toast.success("Transition added successfully");
  }, [getPixelsPerSecond, timeline.tracks, validateTransitionPlacement]);

  const handleDeleteTransition = useCallback((transitionId: string) => {
    setTimeline(prev => {
      const updatedTracks = prev.tracks.map(track => {
        // Find the transition being deleted
        const transitionToDelete = track.transitions.find(t => t.id === transitionId);
        if (!transitionToDelete) return track;

        // Calculate the overlap distance to restore
        const pixelsPerSecond = getPixelsPerSecond();
        const transitionWidthPx = (transitionToDelete.durationInFrames / FPS) * pixelsPerSecond;

        return {
          ...track,
          transitions: track.transitions.filter(t => t.id !== transitionId),
          scrubbers: track.scrubbers.map(scrubber => {
            // Reset transition references
            const baseScrubber = {
              ...scrubber,
              left_transition_id: scrubber.left_transition_id === transitionId ? null : scrubber.left_transition_id,
              right_transition_id: scrubber.right_transition_id === transitionId ? null : scrubber.right_transition_id,
            };

            // If this scrubber was the right scrubber in the deleted transition, move it back
            if (scrubber.id === transitionToDelete.rightScrubberId) {
              // Find the left scrubber to calculate the new position
              const leftScrubber = track.scrubbers.find(s => s.id === transitionToDelete.leftScrubberId);
              if (leftScrubber) {
                // Position the right scrubber right after the left scrubber (no overlap)
                return { ...baseScrubber, left: leftScrubber.left + leftScrubber.width };
              }
            }

            return baseScrubber;
          })
        };
      });

      return {
        ...prev,
        tracks: updatedTracks
      };
    });

    toast.success("Transition deleted");
  }, [getPixelsPerSecond]);

  const handleUpdateScrubberWithLocking = useCallback((updatedScrubber: ScrubberState) => {
    const connectedElements = getConnectedElements(updatedScrubber.id);
    const scrubberConnected = connectedElements.filter(id => 
      timeline.tracks.some(track => track.scrubbers.some(s => s.id === id))
    );

    if (scrubberConnected.length > 1) {
      // Calculate offset
      const originalScrubber = getAllScrubbers().find(s => s.id === updatedScrubber.id);
      if (!originalScrubber) return;

      const offsetX = updatedScrubber.left - originalScrubber.left;
      const offsetY = updatedScrubber.y - originalScrubber.y;

      // Update all connected scrubbers with the same offset
      setTimeline(prev => ({
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          scrubbers: track.scrubbers.map(scrubber => {
            if (scrubberConnected.includes(scrubber.id)) {
              return {
                ...scrubber,
                left: scrubber.left + offsetX,
                y: scrubber.y + offsetY,
              };
            }
            return scrubber;
          })
        }))
      }));
    } else {
      handleUpdateScrubber(updatedScrubber);
    }
  }, [getConnectedElements, timeline, getAllScrubbers, handleUpdateScrubber]);

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
    // Transition management
    handleAddTransitionToTrack,
    handleDeleteTransition,
    getConnectedElements,
    handleUpdateScrubberWithLocking,
  };
};
