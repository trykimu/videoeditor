import { useState, useCallback, useEffect, useRef } from "react";
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
      { id: "track-1", scrubbers: [], transitions: [] },
      { id: "track-2", scrubbers: [], transitions: [] },
      { id: "track-3", scrubbers: [], transitions: [] },
      { id: "track-4", scrubbers: [], transitions: [] },
    ],
  });

  const [timelineWidth, setTimelineWidth] = useState(2000);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const zoomLevelRef = useRef(DEFAULT_ZOOM);

  // Local, session-only undo/redo stacks (not persisted)
  const [undoStack, setUndoStack] = useState<TimelineState[]>([]);
  const [redoStack, setRedoStack] = useState<TimelineState[]>([]);
  const isApplyingHistoryRef = useRef(false);

  const deepClone = useCallback(
    <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
    []
  );

  const snapshotTimeline = useCallback(() => {
    setUndoStack((prev) => {
      const cloned = deepClone(timeline);
      const next = [...prev, cloned];
      // cap history to last 100 states
      return next.length > 100 ? next.slice(next.length - 100) : next;
    });
    setRedoStack([]);
  }, [timeline, deepClone]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const undo = useCallback(() => {
    if (!undoStack.length) return;
    isApplyingHistoryRef.current = true;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => [...s, deepClone(timeline)]);
    setTimeline(deepClone(previous));
    isApplyingHistoryRef.current = false;
  }, [undoStack, deepClone, timeline]);

  const redo = useCallback(() => {
    if (!redoStack.length) return;
    isApplyingHistoryRef.current = true;
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => [...s, deepClone(timeline)]);
    setTimeline(deepClone(nextState));
    isApplyingHistoryRef.current = false;
  }, [redoStack, deepClone, timeline]);

  const EXPANSION_THRESHOLD = 200;
  const EXPANSION_AMOUNT = 1000;

  // Get zoomed pixels per second
  const getPixelsPerSecond = useCallback(() => {
    return PIXELS_PER_SECOND * zoomLevel;
  }, [zoomLevel]);

  // Zoom functions that update scrubber positions and widths accordingly
  const handleZoomIn = useCallback(() => {
    const currentZoom = zoomLevelRef.current;
    const newZoom = Math.min(MAX_ZOOM, currentZoom * 1.5);
    const zoomRatio = newZoom / currentZoom;

    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);

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
  }, []);

  const handleZoomOut = useCallback(() => {
    const currentZoom = zoomLevelRef.current;
    const newZoom = Math.max(MIN_ZOOM, currentZoom / 1.5);
    const zoomRatio = newZoom / currentZoom;

    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);

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
  }, []);

  const handleZoomReset = useCallback(() => {
    const currentZoom = zoomLevelRef.current;
    const newZoom = DEFAULT_ZOOM;
    const zoomRatio = newZoom / currentZoom;

    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);

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
          groupped_scrubbers: scrubber.groupped_scrubbers,
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

  const getTimelineState = useCallback(() => {
    return timeline;
  }, [timeline]);

  const setTimelineFromServer = useCallback((newTimeline: TimelineState) => {
    setTimeline(newTimeline);
  }, []);

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
    snapshotTimeline();
    const newTrack: TrackState = {
      id: generateUUID(),
      scrubbers: [],
      transitions: [],
    };
    setTimeline((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
  }, [snapshotTimeline]);

  const handleDeleteTrack = useCallback(
    (trackId: string) => {
      snapshotTimeline();
      setTimeline((prev) => ({
        tracks: prev.tracks.filter((t) => t.id !== trackId),
      }));
    },
    [snapshotTimeline]
  );

  const getAllScrubbers = useCallback(() => {
    return timeline.tracks.flatMap((track) => track.scrubbers);
  }, [timeline]);

  const getAllTransitions = useCallback(() => {
    const transitions: { [id: string]: Transition } = {};
    for (const track of timeline.tracks) {
      for (const transition of track.transitions) {
        transitions[transition.id] = transition;
      }
    }
    return transitions;
  }, [timeline]);

  const handleUpdateScrubber = useCallback(
    (updatedScrubber: ScrubberState) => {
      setTimeline((prev) => {
        // On any new edit (not history replay), branch history:
        if (!isApplyingHistoryRef.current) {
          setUndoStack((u) => {
            const clonedPrev = deepClone(prev);
            const next = [...u, clonedPrev];
            return next.length > 100 ? next.slice(next.length - 100) : next;
          });
          setRedoStack([]);
        }

        // Find current track index of the scrubber
        const currentTrackIndex = prev.tracks.findIndex((track) =>
          track.scrubbers.some((scrubber) => scrubber.id === updatedScrubber.id)
        );

        if (currentTrackIndex === -1) return prev;

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
                scrubbers: track.scrubbers.filter(
                  (scrubber) => scrubber.id !== updatedScrubber.id
                ),
              };
            } else if (index === newTrackIndex) {
              // Add to new track
              return {
                ...track,
                scrubbers: [...track.scrubbers, updatedScrubber],
              };
            }
            return track;
          }),
        };
      });
    },
    [deepClone]
  );

  const handleDeleteScrubber = useCallback(
    (scrubberId: string) => {
      snapshotTimeline();
      // Find all transitions connected to the scrubber being deleted
      const connectedTransitionIds: string[] = [];

      timeline.tracks.forEach((track) => {
        track.transitions.forEach((transition) => {
          if (
            transition.leftScrubberId === scrubberId ||
            transition.rightScrubberId === scrubberId
          ) {
            connectedTransitionIds.push(transition.id);
          }
        });
      });

      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks
          .map((track) => ({
            ...track,
            // Remove the scrubber
            scrubbers: track.scrubbers.filter(
              (scrubber) => scrubber.id !== scrubberId
            ),
            // Remove connected transitions
            transitions: track.transitions.filter(
              (transition) => !connectedTransitionIds.includes(transition.id)
            ),
          }))
          .map((track) => ({
            ...track,
            // Clean up transition references in remaining scrubbers
            scrubbers: track.scrubbers.map((scrubber) => ({
              ...scrubber,
              left_transition_id: connectedTransitionIds.includes(
                scrubber.left_transition_id || ""
              )
                ? null
                : scrubber.left_transition_id,
              right_transition_id: connectedTransitionIds.includes(
                scrubber.right_transition_id || ""
              )
                ? null
                : scrubber.right_transition_id,
            })),
          })),
      }));

      // Show feedback message
      if (connectedTransitionIds.length > 0) {
        toast.success(
          `Scrubber and ${connectedTransitionIds.length} connected transition${connectedTransitionIds.length > 1 ? "s" : ""
          } deleted`
        );
      } else {
        toast.success("Scrubber deleted");
      }
    },
    [timeline, snapshotTimeline]
  );

  const handleDeleteScrubbersByMediaBinId = useCallback(
    (mediaBinId: string) => {
      snapshotTimeline();
      // Find all scrubbers that will be deleted
      const scrubbersToDelete: string[] = [];
      timeline.tracks.forEach((track) => {
        track.scrubbers.forEach((scrubber) => {
          if (scrubber.sourceMediaBinId === mediaBinId) {
            scrubbersToDelete.push(scrubber.id);
          }
        });
      });

      // Find all transitions connected to any of the scrubbers being deleted
      const connectedTransitionIds: string[] = [];
      timeline.tracks.forEach((track) => {
        track.transitions.forEach((transition) => {
          if (
            scrubbersToDelete.includes(transition.leftScrubberId || "") ||
            scrubbersToDelete.includes(transition.rightScrubberId || "")
          ) {
            connectedTransitionIds.push(transition.id);
          }
        });
      });

      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks
          .map((track) => ({
            ...track,
            // Remove scrubbers with matching media bin ID
            scrubbers: track.scrubbers.filter(
              (scrubber) => scrubber.sourceMediaBinId !== mediaBinId
            ),
            // Remove connected transitions
            transitions: track.transitions.filter(
              (transition) => !connectedTransitionIds.includes(transition.id)
            ),
          }))
          .map((track) => ({
            ...track,
            // Clean up transition references in remaining scrubbers
            scrubbers: track.scrubbers.map((scrubber) => ({
              ...scrubber,
              left_transition_id: connectedTransitionIds.includes(
                scrubber.left_transition_id || ""
              )
                ? null
                : scrubber.left_transition_id,
              right_transition_id: connectedTransitionIds.includes(
                scrubber.right_transition_id || ""
              )
                ? null
                : scrubber.right_transition_id,
            })),
          })),
      }));

      // Show feedback message
      if (scrubbersToDelete.length > 0) {
        if (connectedTransitionIds.length > 0) {
          toast.success(
            `${scrubbersToDelete.length} scrubber${scrubbersToDelete.length > 1 ? "s" : ""
            } and ${connectedTransitionIds.length} connected transition${connectedTransitionIds.length > 1 ? "s" : ""
            } deleted`
          );
        } else {
          toast.success(
            `${scrubbersToDelete.length} scrubber${scrubbersToDelete.length > 1 ? "s" : ""
            } deleted`
          );
        }
      }
    },
    [timeline, snapshotTimeline]
  );

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

  // Helper function to recursively generate new UUIDs for grouped scrubbers and their transitions
  const generateNewUUIDsForGroupedScrubbers = useCallback((
    scrubbers: ScrubberState[] | null,
    allTransitions?: { [id: string]: Transition }
  ): { scrubbers: ScrubberState[] | null, clonedTransitions: Transition[] } => {
    if (!scrubbers) return { scrubbers: null, clonedTransitions: [] };

    const transitionIdMapping: { [oldId: string]: string } = {};
    const scrubberIdMapping: { [oldId: string]: string } = {};
    const clonedTransitions: Transition[] = [];

    // First pass: collect all transition IDs and scrubber IDs that need to be cloned
    const collectIds = (scrubberList: ScrubberState[]) => {
      for (const scrubber of scrubberList) {
        scrubberIdMapping[scrubber.id] = generateUUID();

        if (scrubber.left_transition_id) {
          transitionIdMapping[scrubber.left_transition_id] = generateUUID();
        }
        if (scrubber.right_transition_id) {
          transitionIdMapping[scrubber.right_transition_id] = generateUUID();
        }
        if (scrubber.groupped_scrubbers) {
          collectIds(scrubber.groupped_scrubbers);
        }
      }
    };

    collectIds(scrubbers);

    // Clone transitions with new IDs and updated scrubber references if we have access to all transitions
    if (allTransitions) {
      for (const [oldTransitionId, newTransitionId] of Object.entries(transitionIdMapping)) {
        const originalTransition = allTransitions[oldTransitionId];
        if (originalTransition) {
          clonedTransitions.push({
            ...originalTransition,
            id: newTransitionId,
            leftScrubberId: originalTransition.leftScrubberId ?
              scrubberIdMapping[originalTransition.leftScrubberId] || originalTransition.leftScrubberId : null,
            rightScrubberId: originalTransition.rightScrubberId ?
              scrubberIdMapping[originalTransition.rightScrubberId] || originalTransition.rightScrubberId : null,
          });
        }
      }
    }

    // Second pass: update scrubbers with new IDs
    const updateScrubbers = (scrubberList: ScrubberState[]): ScrubberState[] => {
      return scrubberList.map((scrubber) => {
        const result = generateNewUUIDsForGroupedScrubbers(scrubber.groupped_scrubbers, allTransitions);
        clonedTransitions.push(...result.clonedTransitions);

        return {
          ...scrubber,
          id: scrubberIdMapping[scrubber.id],
          left_transition_id: scrubber.left_transition_id ? transitionIdMapping[scrubber.left_transition_id] || null : null,
          right_transition_id: scrubber.right_transition_id ? transitionIdMapping[scrubber.right_transition_id] || null : null,
          groupped_scrubbers: result.scrubbers,
        };
      });
    };

    return {
      scrubbers: updateScrubbers(scrubbers),
      clonedTransitions: clonedTransitions,
    };
  }, []);

  const handleDropOnTrack = useCallback(
    (item: MediaBinItem, trackId: string, dropLeftPx: number) => {
      snapshotTimeline();
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
      if ((item.mediaType === "video" || item.mediaType === "audio" || item.mediaType === "groupped_scrubber") && item.durationInSeconds) {
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

      // Generate new UUIDs for grouped scrubbers and their transitions to prevent collisions when ungrouping
      const allTransitions = getAllTransitions();
      const groupedResult = item.mediaType === "groupped_scrubber"
        ? generateNewUUIDsForGroupedScrubbers(item.groupped_scrubbers, allTransitions)
        : { scrubbers: item.groupped_scrubbers, clonedTransitions: [] };

      const processedGroupedScrubbers = groupedResult.scrubbers;
      const clonedTransitions = groupedResult.clonedTransitions;

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
        groupped_scrubbers: processedGroupedScrubbers,
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

      // Add scrubber and transitions to track
      if (clonedTransitions.length > 0) {
        // Use a more comprehensive approach to add both scrubber and transitions
        setTimeline((prev) => ({
          ...prev,
          tracks: prev.tracks.map((track) =>
            track.id === trackId
              ? {
                ...track,
                scrubbers: [...track.scrubbers, newScrubber],
                transitions: [...track.transitions, ...clonedTransitions]
              }
              : track
          ),
        }));
      } else {
        handleAddScrubberToTrack(trackId, newScrubber);
      }
    }, [
    timeline.tracks,
    handleAddScrubberToTrack,
    getPixelsPerSecond,
    generateNewUUIDsForGroupedScrubbers,
    getAllTransitions,
    snapshotTimeline,
  ]
  );

  const handleSplitScrubberAtRuler = useCallback(
    (rulerPositionPx: number, selectedScrubberId: string | null) => {
      snapshotTimeline();
      if (!selectedScrubberId) {
        return 0; // No scrubber selected
      }

      const pixelsPerSecond = getPixelsPerSecond();
      const splitTimeInSeconds = rulerPositionPx / pixelsPerSecond;

      // Find the selected scrubber
      const allScrubbers = timeline.tracks.flatMap((track) => track.scrubbers);
      const selectedScrubber = allScrubbers.find(
        (scrubber) => scrubber.id === selectedScrubberId
      );

      if (!selectedScrubber) {
        return 0; // Selected scrubber not found
      }

      const startTime = selectedScrubber.left / pixelsPerSecond;
      const endTime =
        (selectedScrubber.left + selectedScrubber.width) / pixelsPerSecond;

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
      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) => ({
          ...track,
          scrubbers: track.scrubbers.flatMap((scrubber) => {
            if (scrubber.id === selectedScrubberId) {
              return [firstScrubber, secondScrubber];
            }
            return [scrubber];
          }),
        })),
      }));

      return 1; // One scrubber was split
    },
    [timeline, getPixelsPerSecond, snapshotTimeline]
  );

  // Transition management functions
  const validateTransitionPlacement = useCallback(
    (
      leftScrubberId: string | null,
      rightScrubberId: string | null,
      transition: Transition,
      trackId: string
    ): { valid: boolean; error?: string } => {
      const track = timeline.tracks.find((t) => t.id === trackId);
      if (!track) return { valid: false, error: "Track not found" };

      // Get scrubbers
      const leftScrubber = leftScrubberId
        ? track.scrubbers.find((s) => s.id === leftScrubberId)
        : null;
      const rightScrubber = rightScrubberId
        ? track.scrubbers.find((s) => s.id === rightScrubberId)
        : null;

      // Rule 1: Transition can't be longer than adjacent sequences
      if (leftScrubber) {
        const leftDuration = (leftScrubber.width / getPixelsPerSecond()) * FPS;
        if (transition.durationInFrames > leftDuration) {
          return {
            valid: false,
            error: "Transition is longer than the previous sequence",
          };
        }
      }

      if (rightScrubber) {
        const rightDuration =
          (rightScrubber.width / getPixelsPerSecond()) * FPS;
        if (transition.durationInFrames > rightDuration) {
          return {
            valid: false,
            error: "Transition is longer than the next sequence",
          };
        }
      }

      // Rule 2: No two transitions next to each other
      if (
        leftScrubber?.right_transition_id &&
        rightScrubber?.left_transition_id
      ) {
        return {
          valid: false,
          error: "Cannot place transitions next to each other",
        };
      }

      // Rule 3: Must have both left and right scrubbers for a transition
      if (!leftScrubber || !rightScrubber) {
        return { valid: false, error: "You need 2 scrubbers for a transition" };
      }

      return { valid: true };
    },
    [timeline, getPixelsPerSecond]
  );

  const getConnectedElements = useCallback(
    (elementId: string): string[] => {
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
              if (
                scrubber.left_transition_id &&
                !connected.has(scrubber.left_transition_id)
              ) {
                toProcess.push(scrubber.left_transition_id);
              }
              if (
                scrubber.right_transition_id &&
                !connected.has(scrubber.right_transition_id)
              ) {
                toProcess.push(scrubber.right_transition_id);
              }
            }
          }

          // Check transitions
          for (const transition of track.transitions) {
            if (transition.id === currentId) {
              if (
                transition.leftScrubberId &&
                !connected.has(transition.leftScrubberId)
              ) {
                toProcess.push(transition.leftScrubberId);
              }
              if (
                transition.rightScrubberId &&
                !connected.has(transition.rightScrubberId)
              ) {
                toProcess.push(transition.rightScrubberId);
              }
            }
          }
        }
      }

      return Array.from(connected);
    },
    [timeline]
  );

  const handleAddTransitionToTrack = useCallback(
    (trackId: string, transition: Transition, dropPosition: number) => {
      snapshotTimeline();
      const track = timeline.tracks.find((t) => t.id === trackId);
      if (!track) {
        toast.error("Track not found");
        return;
      }

      // Find scrubbers at or near the drop position
      const scrubbers = track.scrubbers
        .filter(
          (s) => s.y === timeline.tracks.findIndex((t) => t.id === trackId)
        )
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
            const prevScrubber = scrubbers[i - 1] || null;
            if (prevScrubber) {
              // Check gap to previous scrubber
              const gap =
                scrubber.left - (prevScrubber.left + prevScrubber.width);
              if (gap <= 10) {
                // Within snap distance
                // Create transition between previous and current scrubber
                leftScrubber = prevScrubber;
                rightScrubber = scrubber;
              } else {
                // Too far - create intro transition for current scrubber
                leftScrubber = null;
                rightScrubber = scrubber;
              }
            } else {
              // No previous scrubber - create intro transition
              leftScrubber = null;
              rightScrubber = scrubber;
            }
          } else {
            // Closer to right edge
            const nextScrubber = scrubbers[i + 1] || null;
            if (nextScrubber) {
              // Check gap to next scrubber
              const gap = nextScrubber.left - (scrubber.left + scrubber.width);
              if (gap <= 10) {
                // Within snap distance
                // Create transition between current and next scrubber
                leftScrubber = scrubber;
                rightScrubber = nextScrubber;
              } else {
                // Too far - create outro transition for current scrubber
                leftScrubber = scrubber;
                rightScrubber = null;
              }
            } else {
              // No next scrubber - create outro transition
              leftScrubber = scrubber;
              rightScrubber = null;
            }
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
      if (
        leftScrubber?.mediaType === "audio" ||
        rightScrubber?.mediaType === "audio"
      ) {
        toast.error("Audio scrubbers cannot have transitions");
        return;
      }

      // Validate grouped scrubbers
      if (
        leftScrubber?.mediaType === "groupped_scrubber" ||
        rightScrubber?.mediaType === "groupped_scrubber"
      ) {
        toast.error("Grouped scrubbers cannot have transitions");
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
      const transitionWidthPx =
        (updatedTransition.durationInFrames / 30) * pixelsPerSecond;

      // Define snap distance threshold (same as in TimelineTracks.tsx)
      const SNAP_DISTANCE = 10;

      // Calculate the gap between scrubbers to determine if they should be moved together
      const shouldMoveScrubbersTogetherForOverlap = () => {
        if (!leftScrubber || !rightScrubber) return false;

        const leftScrubberEnd = leftScrubber.left + leftScrubber.width;
        const gap = rightScrubber.left - leftScrubberEnd;

        // Only move scrubbers together if the gap is within snap distance
        return gap <= SNAP_DISTANCE;
      };

      // Add transition to track and update scrubber references with overlap positioning
      setTimeline((prev) => ({
        ...prev,
        tracks: prev.tracks.map((track) => {
          if (track.id !== trackId) return track;

          return {
            ...track,
            transitions: [...track.transitions, updatedTransition],
            scrubbers: track.scrubbers.map((scrubber) => {
              if (scrubber.id === leftScrubber?.id) {
                return {
                  ...scrubber,
                  right_transition_id: updatedTransition.id,
                };
              }
              if (scrubber.id === rightScrubber?.id) {
                // Only move the right scrubber to create overlap if scrubbers are close enough
                if (shouldMoveScrubbersTogetherForOverlap()) {
                  // Move the right scrubber to create overlap
                  // The right scrubber should start at (leftScrubber.end - transitionWidth)
                  const newLeft = leftScrubber
                    ? leftScrubber.left + leftScrubber.width - transitionWidthPx
                    : scrubber.left;
                  return {
                    ...scrubber,
                    left: newLeft,
                    left_transition_id: updatedTransition.id,
                  };
                } else {
                  // If there's a large gap, don't move the scrubber - treat it as a transition for the scrubber alone
                  return {
                    ...scrubber,
                    left_transition_id: updatedTransition.id,
                  };
                }
              }
              return scrubber;
            }),
          };
        }),
      }));

      toast.success("Transition added successfully");
    }, [
    getPixelsPerSecond,
    timeline.tracks,
    validateTransitionPlacement,
    snapshotTimeline,
  ]);

  const handleDeleteTransition = useCallback(
    (transitionId: string) => {
      snapshotTimeline();
      setTimeline((prev) => {
        // 1. Locate the transition and its track
        let transitionToDelete: Transition | null = null;
        let targetTrackId: string | null = null;

        for (const track of prev.tracks) {
          const foundTransition = track.transitions.find(
            (t) => t.id === transitionId
          );
          if (foundTransition) {
            transitionToDelete = foundTransition;
            targetTrackId = track.id;
            break;
          }
        }

        if (!transitionToDelete || !targetTrackId) {
          console.warn(`Transition with ID ${transitionId} not found in any track`);
          return prev;
        }

        // 2. Prepare scrubber movement calculations
        let movementDistance = 0;
        let rightScrubberNewLeft = 0;
        let shouldRestorePosition = false;
        let rightScrubber: ScrubberState | null = null;
        let leftScrubber: ScrubberState | null = null;

        const targetTrack = prev.tracks.find((t) => t.id === targetTrackId);
        if (targetTrack && transitionToDelete) {
          const pixelsPerSecond = getPixelsPerSecond();
          const transitionWidthPx =
            (transitionToDelete.durationInFrames / FPS) * pixelsPerSecond;

          const SNAP_DISTANCE = 10;

          rightScrubber =
            targetTrack.scrubbers.find(
              (s) => s.id === transitionToDelete.rightScrubberId
            ) || null;
          leftScrubber =
            targetTrack.scrubbers.find(
              (s) => s.id === transitionToDelete.leftScrubberId
            ) || null;

          if (rightScrubber && leftScrubber) {
            const currentGap =
              rightScrubber.left - (leftScrubber.left + leftScrubber.width);
            const originalGap = currentGap + transitionWidthPx;

            if (originalGap <= SNAP_DISTANCE) {
              shouldRestorePosition = true;
              rightScrubberNewLeft =
                leftScrubber.left + leftScrubber.width + originalGap;
              movementDistance = rightScrubberNewLeft - rightScrubber.left;
            }
          }
        }

        // 3. Build updated tracks
        const updatedTracks = prev.tracks.map((track) => {
          const isTargetTrack = track.id === targetTrackId;

          return {
            ...track,
            transitions: isTargetTrack
              ? track.transitions.filter((t) => t.id !== transitionId)
              : track.transitions,

            scrubbers: track.scrubbers.map((scrubber) => {
              // Always clear transition references
              const baseScrubber: ScrubberState = {
                ...scrubber,
                left_transition_id:
                  scrubber.left_transition_id === transitionId
                    ? null
                    : scrubber.left_transition_id,
                right_transition_id:
                  scrubber.right_transition_id === transitionId
                    ? null
                    : scrubber.right_transition_id,
              };

              // Restore right scrubber position if snapped
              if (
                isTargetTrack &&
                shouldRestorePosition &&
                transitionToDelete &&
                scrubber.id === transitionToDelete.rightScrubberId
              ) {
                return { ...baseScrubber, left: rightScrubberNewLeft };
              }

              // Shift later scrubbers on the same track if needed
              if (
                isTargetTrack &&
                rightScrubber &&
                scrubber.id !== rightScrubber.id &&
                movementDistance > 0
              ) {
                const rightScrubberOriginalEnd =
                  rightScrubber.left + rightScrubber.width;

                if (
                  scrubber.y === rightScrubber.y &&
                  scrubber.left >= rightScrubberOriginalEnd
                ) {
                  return {
                    ...baseScrubber,
                    left: scrubber.left + movementDistance,
                  };
                }
              }

              return baseScrubber;
            }),
          };
        });

        return { ...prev, tracks: updatedTracks };
      });

      toast.success("Transition deleted");
    },
    [getPixelsPerSecond, snapshotTimeline]
  );


  // Check if there's a transition between two scrubbers that allows overlap
  const hasTransitionBetween = useCallback(
    (scrubber1Id: string, scrubber2Id: string) => {
      const allTransitions = timeline.tracks.flatMap(
        (track) => track.transitions
      );
      return allTransitions.some(
        (transition) =>
          (transition.leftScrubberId === scrubber1Id &&
            transition.rightScrubberId === scrubber2Id) ||
          (transition.leftScrubberId === scrubber2Id &&
            transition.rightScrubberId === scrubber1Id)
      );
    },
    [timeline]
  );

  // Check collision with track awareness - allow overlap if transition exists
  const checkCollisionWithTrack = useCallback(
    (newScrubber: ScrubberState, excludeId?: string) => {
      const allScrubbers = getAllScrubbers();
      return allScrubbers.some((other) => {
        if (other.id === excludeId || other.y !== newScrubber.y) return false;

        const otherStart = other.left;
        const otherEnd = other.left + other.width;
        const newStart = newScrubber.left;
        const newEnd = newScrubber.left + newScrubber.width;

        const hasOverlap = !(newEnd <= otherStart || newStart >= otherEnd);

        // If there's overlap, check if there's a transition that allows it
        if (hasOverlap && hasTransitionBetween(newScrubber.id, other.id)) {
          return false; // Allow overlap due to transition
        }

        return hasOverlap;
      });
    },
    [getAllScrubbers, hasTransitionBetween]
  );

  // Handle collision detection and smart positioning
  const handleCollisionDetection = useCallback(
    (
      updatedScrubber: ScrubberState,
      originalScrubber: ScrubberState,
      timelineWidth: number
    ) => {
      const allScrubbers = getAllScrubbers();
      const otherScrubbers = allScrubbers.filter(
        (s) => s.id !== updatedScrubber.id
      );

      // Find colliding scrubbers on the same track
      const collidingScrubbers = otherScrubbers.filter((other) => {
        if (other.y !== updatedScrubber.y) return false;
        const otherStart = other.left;
        const otherEnd = other.left + other.width;
        const newStart = updatedScrubber.left;
        const newEnd = updatedScrubber.left + updatedScrubber.width;
        return !(newEnd <= otherStart || newStart >= otherEnd);
      });

      if (collidingScrubbers.length === 0) {
        // No collision - use the updated position
        if (!checkCollisionWithTrack(updatedScrubber, updatedScrubber.id)) {
          return updatedScrubber;
        }
      } else {
        // Collision detected - try smart positioning
        const collidingScrubber = collidingScrubbers[0]; // Handle first collision
        const collidingStart = collidingScrubber.left;
        const collidingEnd = collidingScrubber.left + collidingScrubber.width;

        // Determine which side of the colliding scrubber the mouse is closest to
        const mouseCenter = updatedScrubber.left + updatedScrubber.width / 2;
        const collidingCenter = collidingStart + collidingScrubber.width / 2;

        let snapToLeft: number;
        let snapToRight: number;

        if (mouseCenter < collidingCenter) {
          // Mouse is on the left side - try snapping to left edge first
          snapToLeft = collidingStart - updatedScrubber.width;
          snapToRight = collidingEnd;
        } else {
          // Mouse is on the right side - try snapping to right edge first
          snapToRight = collidingEnd;
          snapToLeft = collidingStart - updatedScrubber.width;
        }

        // Try the preferred side first
        const preferredScrubber =
          mouseCenter < collidingCenter
            ? { ...updatedScrubber, left: Math.max(0, snapToLeft) }
            : {
              ...updatedScrubber,
              left: Math.min(
                snapToRight,
                timelineWidth - updatedScrubber.width
              ),
            };

        if (!checkCollisionWithTrack(preferredScrubber, updatedScrubber.id)) {
          return preferredScrubber;
        } else {
          // Try the other side
          const alternateScrubber =
            mouseCenter < collidingCenter
              ? {
                ...updatedScrubber,
                left: Math.min(
                  snapToRight,
                  timelineWidth - updatedScrubber.width
                ),
              }
              : { ...updatedScrubber, left: Math.max(0, snapToLeft) };

          if (!checkCollisionWithTrack(alternateScrubber, updatedScrubber.id)) {
            return alternateScrubber;
          }
        }
        // If both sides are blocked, return original position (scrubber stops)
        return originalScrubber;
      }

      return updatedScrubber;
    },
    [getAllScrubbers, checkCollisionWithTrack]
  );

  const handleUpdateScrubberWithLocking = useCallback(
    (updatedScrubber: ScrubberState) => {
      // Any new edit should invalidate redo branch; we snapshot on mousedown separately
      if (!isApplyingHistoryRef.current) {
        setRedoStack([]);
      }
      const connectedElements = getConnectedElements(updatedScrubber.id);
      const scrubberConnected = connectedElements.filter((id) =>
        timeline.tracks.some((track) =>
          track.scrubbers.some((s) => s.id === id)
        )
      );

      // Check if this scrubber is connected to transitions (more than just itself)
      const isConnectedToTransitions = scrubberConnected.length > 1;

      if (isConnectedToTransitions) {
        // Handle collision detection for connected scrubbers as a group
        const originalScrubber = getAllScrubbers().find(
          (s) => s.id === updatedScrubber.id
        );
        if (!originalScrubber) return;

        const offsetX = updatedScrubber.left - originalScrubber.left;
        const offsetY = updatedScrubber.y - originalScrubber.y;

        // Calculate new positions for all connected scrubbers
        const allScrubbers = getAllScrubbers();
        const connectedScrubbers = allScrubbers.filter((s) =>
          scrubberConnected.includes(s.id)
        );
        const updatedConnectedScrubbers = connectedScrubbers.map(
          (scrubber) => ({
            ...scrubber,
            left: scrubber.left + offsetX,
            y: scrubber.y + offsetY,
          })
        );

        // Check if any of the connected scrubbers would collide with non-connected scrubbers
        const hasCollision = updatedConnectedScrubbers.some(
          (updatedConnectedScrubber) => {
            return allScrubbers.some((other) => {
              // Skip if other scrubber is also in the connected group
              if (scrubberConnected.includes(other.id)) return false;
              // Skip if on different tracks
              if (other.y !== updatedConnectedScrubber.y) return false;

              const otherStart = other.left;
              const otherEnd = other.left + other.width;
              const newStart = updatedConnectedScrubber.left;
              const newEnd =
                updatedConnectedScrubber.left + updatedConnectedScrubber.width;

              const hasOverlap = !(
                newEnd <= otherStart || newStart >= otherEnd
              );

              // If there's overlap, check if there's a transition that allows it
              if (
                hasOverlap &&
                hasTransitionBetween(updatedConnectedScrubber.id, other.id)
              ) {
                return false; // Allow overlap due to transition
              }

              return hasOverlap;
            });
          }
        );

        // Only update if there's no collision
        if (!hasCollision) {
          setTimeline((prev) => ({
            ...prev,
            tracks: prev.tracks.map((track) => ({
              ...track,
              scrubbers: track.scrubbers.map((scrubber) => {
                if (scrubberConnected.includes(scrubber.id)) {
                  return {
                    ...scrubber,
                    left: scrubber.left + offsetX,
                    y: scrubber.y + offsetY,
                  };
                }
                return scrubber;
              }),
            })),
          }));
        }
        // If there is a collision, don't move the connected scrubbers (they stay in place)
      } else {
        // Run collision detection for standalone scrubbers
        const originalScrubber = getAllScrubbers().find(
          (s) => s.id === updatedScrubber.id
        );
        if (!originalScrubber) return;

        const finalScrubber = handleCollisionDetection(
          updatedScrubber,
          originalScrubber,
          timelineWidth
        );
        handleUpdateScrubber(finalScrubber);
      }
    },
    [
      getConnectedElements,
      timeline,
      getAllScrubbers,
      handleUpdateScrubber,
      handleCollisionDetection,
      timelineWidth,
      hasTransitionBetween,
    ]
  );

  // Group multiple scrubbers into a single grouped scrubber
  const handleGroupScrubbers = useCallback((scrubberIds: string[]) => {
    if (scrubberIds.length < 2) return;

    setTimeline((prev) => {
      // Find all scrubbers to group and their tracks
      const scrubbersToGroup: ScrubberState[] = [];
      let targetTrackIndex = -1;

      for (const track of prev.tracks) {
        for (const scrubber of track.scrubbers) {
          if (scrubberIds.includes(scrubber.id)) {
            scrubbersToGroup.push(scrubber);
            if (targetTrackIndex === -1) {
              targetTrackIndex = prev.tracks.indexOf(track);
            }
          }
        }
      }

      scrubbersToGroup.sort((a, b) => a.left - b.left);

      // Calculate grouped scrubber bounds
      const leftmost = Math.min(...scrubbersToGroup.map(s => s.left));
      const rightmost = Math.max(...scrubbersToGroup.map(s => s.left + s.width));
      const topmost = Math.min(...scrubbersToGroup.map(s => s.y || 0));

      // Create grouped scrubber
      const groupedScrubber: ScrubberState = {
        id: generateUUID(),
        mediaType: "groupped_scrubber",
        mediaUrlLocal: null,
        mediaUrlRemote: null,
        media_width: rightmost - leftmost,
        media_height: 60,
        text: null,
        groupped_scrubbers: scrubbersToGroup,
        left_transition_id: null,
        right_transition_id: null,
        name: `Group: ${scrubbersToGroup.map(scrubber => scrubber.name).join(' + ')}`,
        durationInSeconds: (rightmost - leftmost) / (PIXELS_PER_SECOND * zoomLevel),
        uploadProgress: null,
        isUploading: false,
        left: leftmost,
        y: topmost,
        width: rightmost - leftmost,
        sourceMediaBinId: generateUUID(),
        left_player: 0,
        top_player: 0,
        width_player: 0,
        height_player: 0,
        is_dragging: false,
        trimBefore: null,
        trimAfter: null,
      };

      // Remove individual scrubbers and add grouped scrubber
      return {
        ...prev,
        tracks: prev.tracks.map((track, index) => {
          if (index === targetTrackIndex) {
            return {
              ...track,
              scrubbers: [
                ...track.scrubbers.filter(s => !scrubberIds.includes(s.id)),
                groupedScrubber
              ]
            };
          } else {
            return {
              ...track,
              scrubbers: track.scrubbers.filter(s => !scrubberIds.includes(s.id))
            };
          }
        }),
      };
    });
  }, [zoomLevel]);

  // Ungroup a grouped scrubber back into individual scrubbers
  const handleUngroupScrubber = useCallback((groupedScrubberId: string) => {
    setTimeline((prev) => {
      // Find the grouped scrubber
      let groupedScrubber: ScrubberState | null = null;
      let trackIndex = -1;

      for (let i = 0; i < prev.tracks.length; i++) {
        const found = prev.tracks[i].scrubbers.find(s => s.id === groupedScrubberId);
        if (found) {
          groupedScrubber = found;
          trackIndex = i;
          break;
        }
      }

      if (!groupedScrubber || groupedScrubber.mediaType !== "groupped_scrubber" || !groupedScrubber.groupped_scrubbers) {
        return prev;
      }

      // Calculate the original bounds when the scrubbers were grouped
      const groupedIds = groupedScrubber.groupped_scrubbers || [];
      const originalLeftmost = Math.min(...groupedIds.map(s => s.left));
      const originalRightmost = Math.max(...groupedIds.map(s => s.left + s.width));
      const originalTopmost = Math.min(...groupedIds.map(s => s.y || 0));
      const originalGroupWidth = originalRightmost - originalLeftmost;

      // Calculate scaling based on current grouped scrubber vs original bounds
      const topOffset = groupedScrubber.y - originalTopmost;
      const widthScale = originalGroupWidth > 0 ? groupedScrubber.width / originalGroupWidth : 1;

      const individualScrubbers: ScrubberState[] = groupedIds.map((id, _) => ({
        id: id.id,
        mediaType: id.mediaType,
        mediaUrlLocal: id.mediaUrlLocal,
        mediaUrlRemote: id.mediaUrlRemote,
        media_width: id.media_width,
        media_height: id.media_height,
        text: id.text,
        groupped_scrubbers: id.groupped_scrubbers,
        left_transition_id: id.left_transition_id,
        right_transition_id: id.right_transition_id,
        name: id.name,
        durationInSeconds: id.durationInSeconds,
        uploadProgress: id.uploadProgress,
        isUploading: id.isUploading,
        // Scale relative positions and adjust based on current grouped scrubber position
        left: groupedScrubber.left + (id.left - originalLeftmost) * widthScale,
        y: id.y + topOffset,
        width: id.width * widthScale, // Adjust width according to how the group has been scaled
        sourceMediaBinId: id.sourceMediaBinId,
        left_player: id.left_player,
        top_player: id.top_player,
        width_player: id.width_player,
        height_player: id.height_player,
        is_dragging: id.is_dragging,
        trimBefore: id.trimBefore,
        trimAfter: id.trimAfter,
      }));

      // Replace grouped scrubber with individual scrubbers
      return {
        ...prev,
        tracks: prev.tracks.map((track, index) => {
          if (index === trackIndex) {
            return {
              ...track,
              scrubbers: [
                ...track.scrubbers.filter(s => s.id !== groupedScrubberId),
                ...individualScrubbers
              ]
            };
          }
          return track;
        }),
      };
    });
  }, []);

  // Move a grouped scrubber to media bin and remove from timeline
  const handleMoveGroupToMediaBin = useCallback((groupedScrubberId: string, addToMediaBin: (scrubber: ScrubberState, pixelsPerSecond: number) => void) => {
    // Find the grouped scrubber
    const allScrubbers = getAllScrubbers();
    const groupedScrubber = allScrubbers.find(s => s.id === groupedScrubberId);

    if (!groupedScrubber || groupedScrubber.mediaType !== "groupped_scrubber") {
      toast.error("Invalid grouped scrubber");
      return;
    }

    // Add to media bin first with current pixels per second for correct duration calculation
    addToMediaBin(groupedScrubber, getPixelsPerSecond());

    // Then remove from timeline (similar to handleDeleteScrubber)
    setTimeline((prev) => ({
      ...prev,
      tracks: prev.tracks.map((track) => ({
        ...track,
        scrubbers: track.scrubbers.filter(
          (scrubber) => scrubber.id !== groupedScrubberId
        ),
      }))
    }));

    toast.success("Moved grouped scrubber to media bin");
  }, [getAllScrubbers, getPixelsPerSecond]);

  return {
    timeline,
    timelineWidth,
    zoomLevel,
    getPixelsPerSecond,
    getTimelineData,
    getTimelineState,
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
    handleGroupScrubbers,
    handleUngroupScrubber,
    handleMoveGroupToMediaBin,
    // Transition management
    handleAddTransitionToTrack,
    handleDeleteTransition,
    getConnectedElements,
    handleUpdateScrubberWithLocking,
    setTimelineFromServer,
    // Undo/redo
    undo,
    redo,
    canUndo,
    canRedo,
    snapshotTimeline,
  };
};
