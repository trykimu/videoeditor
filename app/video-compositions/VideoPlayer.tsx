import { Player, type PlayerRef } from "@remotion/player";
import { Sequence, AbsoluteFill, Img, Video, Audio } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
  type TransitionPresentation,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { iris } from "@remotion/transitions/iris";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import React from "react";
import {
  FPS,
  PIXELS_PER_SECOND,
  type ScrubberState,
  type TimelineDataItem,
  type TimelineState,
  type Transition,
} from "../components/timeline/types";
import { SortedOutlines, layerContainer, outer } from "./DragDrop";

type TimelineCompositionProps = {
  timelineData: TimelineDataItem[];
  isRendering: boolean; // it's either render (True) or preview (False)
  selectedItem: string | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<string | null>>;
  timeline: TimelineState;
  handleUpdateScrubber: (updateScrubber: ScrubberState) => void;
  getPixelsPerSecond: number | (() => number);
};

// props for the preview mode player
export type VideoPlayerProps = {
  timelineData: TimelineDataItem[];
  durationInFrames: number; // this is for the player to know how long to render (used in preview mode)
  ref: React.Ref<PlayerRef>;
  compositionWidth: number | null; // if null, the player width = max(width)
  compositionHeight: number | null; // if null, the player height = max(height)
  timeline: TimelineState;
  handleUpdateScrubber: (updateScrubber: ScrubberState) => void;
  selectedItem: string | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<string | null>>;
  getPixelsPerSecond: number | (() => number);
};

export function TimelineComposition({
  timelineData,
  isRendering,
  selectedItem,
  setSelectedItem,
  timeline,
  handleUpdateScrubber,
  getPixelsPerSecond,
}: TimelineCompositionProps) {
  // Resolve pixels per second based on rendering mode
  const resolvedPixelsPerSecond = isRendering
    ? (getPixelsPerSecond as number)
    : (getPixelsPerSecond as () => number)();
  // Get all transitions from timelineData
  const allTransitions = timelineData[0].transitions;

  // Step 1: Group scrubbers by trackIndex
  const trackGroups: {
    [trackIndex: number]: {
      content: TimelineDataItem["scrubbers"][0];
      type: string;
    }[];
  } = {};

  for (const timelineItem of timelineData) {
    for (const scrubber of timelineItem.scrubbers) {
      if (!trackGroups[scrubber.trackIndex]) {
        trackGroups[scrubber.trackIndex] = [];
      }
      trackGroups[scrubber.trackIndex].push({
        content: scrubber,
        type: "scrubber",
      });
    }
  }

  // Step 2: Sort scrubbers within each track by startTime
  for (const trackIndex in trackGroups) {
    trackGroups[parseInt(trackIndex)].sort(
      (a, b) => a.content.startTime - b.content.startTime
    );
  }

  // Helper function to create media content
  const createMediaContent = (scrubber: TimelineDataItem['scrubbers'][0] | ScrubberState): React.ReactNode => {
    let content: React.ReactNode = null;

    switch (scrubber.mediaType) {
      case "text":
        content = (
          <AbsoluteFill
            style={{
              left: scrubber.left_player,
              top: scrubber.top_player,
              width: scrubber.width_player,
              height: scrubber.height_player,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                textAlign: scrubber.text?.textAlign || "center",
                width: "100%",
              }}
            >
              <p
                style={{
                  color: scrubber.text?.color || "white",
                  fontSize: scrubber.text?.fontSize
                    ? `${scrubber.text.fontSize}px`
                    : "48px",
                  fontFamily: scrubber.text?.fontFamily || "Arial, sans-serif",
                  fontWeight: scrubber.text?.fontWeight || "normal",
                  margin: 0,
                  padding: "20px",
                }}
              >
                {scrubber.text?.textContent || ""}
              </p>
            </div>
          </AbsoluteFill>
        );
        break;
      case "image": {
        const imageUrl = isRendering
          ? scrubber.mediaUrlRemote || scrubber.mediaUrlLocal
          : scrubber.mediaUrlLocal || scrubber.mediaUrlRemote;
        content = (
          <AbsoluteFill
            style={{
              left: scrubber.left_player,
              top: scrubber.top_player,
              width: scrubber.width_player,
              height: scrubber.height_player,
            }}
          >
            <Img src={imageUrl!} />
          </AbsoluteFill>
        );
        break;
      }
      case "video": {
        const videoUrl = isRendering
          ? scrubber.mediaUrlRemote || scrubber.mediaUrlLocal
          : scrubber.mediaUrlLocal || scrubber.mediaUrlRemote;
        content = (
          <AbsoluteFill
            style={{
              left: scrubber.left_player,
              top: scrubber.top_player,
              width: scrubber.width_player,
              height: scrubber.height_player,
            }}
          >
            <Video
              src={videoUrl!}
              trimBefore={scrubber.trimBefore || undefined}
              trimAfter={scrubber.trimAfter || undefined}
            />
          </AbsoluteFill>
        );
        break;
      }
      case "audio": {
        const audioUrl = isRendering
          ? scrubber.mediaUrlRemote || scrubber.mediaUrlLocal
          : scrubber.mediaUrlLocal || scrubber.mediaUrlRemote;
        content = (
          <Audio
            src={audioUrl!}
            trimBefore={scrubber.trimBefore || undefined}
            trimAfter={scrubber.trimAfter || undefined}
          />
        );
        break;
      }
      default:
        console.warn(`Unknown media type: ${scrubber.mediaType}`);
        break;
    }

    return content;
  };

  // Helper function to get transition presentation
  const getTransitionPresentation = (transition: Transition) => {
    switch (transition.presentation) {
      case "fade":
        return fade();
      case "wipe":
        return wipe();
      case "slide":
        return slide();
      case "flip":
        return flip();
      case "iris":
        return iris({ width: 1000, height: 1000 });
    }
  };

  // Helper function to get transition timing
  const getTransitionTiming = (transition: Transition) => {
    switch (transition.timing) {
      case "spring":
        return springTiming({ durationInFrames: transition.durationInFrames });
      case "linear":
        return linearTiming({ durationInFrames: transition.durationInFrames });
      default:
        return linearTiming({ durationInFrames: transition.durationInFrames });
    }
  };

  // Step 3 & 4: Create tracks with gaps filled and transitions added
  const trackElements: React.ReactNode[] = [];

  for (const trackIndex in trackGroups) {
    const trackIndexNum = parseInt(trackIndex);
    const scrubbers = trackGroups[trackIndexNum];

    if (scrubbers.length === 0) continue;

    const transitionSeriesElements: React.ReactNode[] = [];
    let totalDurationInFrames = 0;

    // Calculate total duration for this track
    if (scrubbers.length > 0) {
      const lastScrubber = scrubbers[scrubbers.length - 1].content;
      totalDurationInFrames = Math.round(lastScrubber.endTime * FPS);
    }

    for (let i = 0; i < scrubbers.length; i++) {
      const scrubber = scrubbers[i].content;
      const isFirstScrubber = i === 0;
      const isLastScrubber = i === scrubbers.length - 1;

      // Add gap before first scrubber if it doesn't start at 0
      if (isFirstScrubber && scrubber.startTime > 0) {
        transitionSeriesElements.push(
          <TransitionSeries.Sequence
            key={`gap-start-${trackIndex}`}
            durationInFrames={Math.max(Math.round(scrubber.startTime * FPS), 1)}
          >
            <AbsoluteFill style={{ backgroundColor: "transparent" }} />
          </TransitionSeries.Sequence>
        );
      }

      // Add left transition if exists (only for first scrubber)
      if (
        isFirstScrubber &&
        scrubber.left_transition_id &&
        allTransitions[scrubber.left_transition_id]
      ) {
        const transition = allTransitions[scrubber.left_transition_id];
        transitionSeriesElements.push(
          <TransitionSeries.Transition
            key={`left-transition-${scrubber.id}`}
            // @ts-expect-error - NOTE: typescript is being stoopid. The fix is nasty so let it be. it is not an error.
            presentation={getTransitionPresentation(transition)}
            timing={getTransitionTiming(transition)}
          />
        );
      }

      // NOTE: groupped nested transitions are not supported yet. I'm too tired to implement it. idc. just dont use it. wtv.
      // Process grouped scrubbers with transitions, then use stack approach for recursion
      if (scrubber.mediaType === "groupped_scrubber") {
        // For grouped scrubbers, handle transitions between grouped items
        const groupedScrubbers = scrubber.groupped_scrubbers || [];

        for (let j = 0; j < groupedScrubbers.length; j++) {
          const grouppedScrubber = groupedScrubbers[j];
          
          // Add left transition for the first grouped scrubber
          if (j === 0 && grouppedScrubber.left_transition_id && allTransitions[grouppedScrubber.left_transition_id]) {
            const transition = allTransitions[grouppedScrubber.left_transition_id];
            transitionSeriesElements.push(
              <TransitionSeries.Transition
                key={`grouped-${grouppedScrubber.id}-left-transition`}
                // @ts-expect-error - NOTE: typescript is being stoopid. The fix is nasty so let it be. it is not an error.
                presentation={getTransitionPresentation(transition)}
                timing={getTransitionTiming(transition)}
              />
            );
          }

          // Use stack approach for each grouped scrubber to handle potential nesting
          const scrubberStack: Array<{
            scrubber: TimelineDataItem['scrubbers'][0] | ScrubberState;
            keyPrefix: string;
            durationCalculation: () => number;
          }> = [];

          scrubberStack.push({
            scrubber: grouppedScrubber,
            keyPrefix: `grouped-${grouppedScrubber.id}`,
            durationCalculation: () => Math.max(Math.round((grouppedScrubber.width / resolvedPixelsPerSecond) * FPS), 1)
          });

          // Process the stack for this grouped scrubber
          while (scrubberStack.length > 0) {
            const stackItem = scrubberStack.pop()!;
            const { scrubber: currentScrubber, keyPrefix, durationCalculation } = stackItem;

            if (currentScrubber.mediaType === "groupped_scrubber") {
              // Add nested grouped scrubbers to the stack in reverse order
              for (let k = (currentScrubber.groupped_scrubbers || []).length - 1; k >= 0; k--) {
                const nestedScrubber = (currentScrubber.groupped_scrubbers || [])[k];
                scrubberStack.push({
                  scrubber: nestedScrubber,
                  keyPrefix: `${keyPrefix}-nested-${nestedScrubber.id}`,
                  durationCalculation: () => Math.max(Math.round((nestedScrubber.width / resolvedPixelsPerSecond) * FPS), 1)
                });
              }
            } else {
              // Create media content for non-grouped scrubber
              const mediaContent = createMediaContent(currentScrubber);
              if (mediaContent) {
                transitionSeriesElements.push(
                  <TransitionSeries.Sequence
                    key={keyPrefix}
                    durationInFrames={durationCalculation()}
                  >
                    {mediaContent}
                  </TransitionSeries.Sequence>
                );
              }
            }
          }

          // Add right transition between grouped scrubbers or at the end
          if (grouppedScrubber.right_transition_id && allTransitions[grouppedScrubber.right_transition_id]) {
            const transition = allTransitions[grouppedScrubber.right_transition_id];
            transitionSeriesElements.push(
              <TransitionSeries.Transition
                key={`grouped-${grouppedScrubber.id}-right-transition`}
                // @ts-expect-error - NOTE: typescript is being stoopid. The fix is nasty so let it be. it is not an error.
                presentation={getTransitionPresentation(transition)}
                timing={getTransitionTiming(transition)}
              />
            );
          }
        }
      } else {
        // Process regular scrubbers using the stack approach
        const scrubberStack: Array<{
          scrubber: TimelineDataItem['scrubbers'][0] | ScrubberState;
          keyPrefix: string;
          durationCalculation: () => number;
        }> = [];

        scrubberStack.push({
          scrubber: scrubber,
          keyPrefix: `scrubber-${scrubber.id}`,
          durationCalculation: () => Math.max(Math.round(scrubber.duration * FPS), 1)
        });

        // Process the stack
        while (scrubberStack.length > 0) {
          const stackItem = scrubberStack.pop()!;
          const { scrubber: currentScrubber, keyPrefix, durationCalculation } = stackItem;

          if (currentScrubber.mediaType === "groupped_scrubber") {
            // Add nested grouped scrubbers to the stack in reverse order
            for (let k = (currentScrubber.groupped_scrubbers || []).length - 1; k >= 0; k--) {
              const nestedScrubber = (currentScrubber.groupped_scrubbers || [])[k];
              scrubberStack.push({
                scrubber: nestedScrubber,
                keyPrefix: `${keyPrefix}-nested-${nestedScrubber.id}`,
                durationCalculation: () => Math.max(Math.round((nestedScrubber.width / resolvedPixelsPerSecond) * FPS), 1)
              });
            }
          } else {
            // Create media content for non-grouped scrubber
            const mediaContent = createMediaContent(currentScrubber);
            if (mediaContent) {
              transitionSeriesElements.push(
                <TransitionSeries.Sequence
                  key={keyPrefix}
                  durationInFrames={durationCalculation()}
                >
                  {mediaContent}
                </TransitionSeries.Sequence>
              );
            }
          }
        }
      }

      // Add right transition if exists
      if (
        scrubber.right_transition_id &&
        allTransitions[scrubber.right_transition_id]
      ) {
        const transition = allTransitions[scrubber.right_transition_id];
        transitionSeriesElements.push(
          <TransitionSeries.Transition
            key={`right-transition-${scrubber.id}`}
            // @ts-expect-error - NOTE: typescript is being stoopid. The fix is nasty so let it be. it is not an error.
            presentation={getTransitionPresentation(transition)}
            timing={getTransitionTiming(transition)}
          />
        );
      }

      // Add gap between scrubbers if there's a gap
      if (!isLastScrubber) {
        const nextScrubber = scrubbers[i + 1].content;
        const gapStart = scrubber.endTime;
        const gapEnd = nextScrubber.startTime;

        if (gapEnd > gapStart) {
          const gapDuration = gapEnd - gapStart;
          transitionSeriesElements.push(
            <TransitionSeries.Sequence
              key={`gap-${trackIndex}-${i}`}
              durationInFrames={Math.max(Math.round(gapDuration * FPS), 1)}
            >
              <AbsoluteFill style={{ backgroundColor: "transparent" }} />
            </TransitionSeries.Sequence>
          );
        }
      }
    }

    // Create the track sequence
    if (transitionSeriesElements.length > 0) {
      trackElements.push(
        <Sequence
          key={`track-${trackIndex}`}
          durationInFrames={totalDurationInFrames}
        >
          <TransitionSeries>{transitionSeriesElements}</TransitionSeries>
        </Sequence>
      );
    }
  }

  if (isRendering) {
    return (
      <AbsoluteFill style={outer}>
        <AbsoluteFill style={layerContainer}>{trackElements}</AbsoluteFill>
      </AbsoluteFill>
    );
  } else {
    return (
      <AbsoluteFill style={outer}>
        <AbsoluteFill style={layerContainer}>{trackElements}</AbsoluteFill>
        <SortedOutlines
          handleUpdateScrubber={handleUpdateScrubber}
          selectedItem={selectedItem}
          timeline={timeline}
          setSelectedItem={setSelectedItem}
        />
      </AbsoluteFill>
    );
  }
}

export function VideoPlayer({
  timelineData,
  durationInFrames,
  ref,
  compositionWidth,
  compositionHeight,
  timeline,
  handleUpdateScrubber,
  selectedItem,
  setSelectedItem,
  getPixelsPerSecond,
}: VideoPlayerProps) {
  // Calculate composition width if not provided
  if (compositionWidth === null) {
    let maxWidth = 0;
    for (const item of timelineData) {
      for (const scrubber of item.scrubbers) {
        if (scrubber.media_width !== null && scrubber.media_width > maxWidth) {
          maxWidth = scrubber.media_width;
        }
      }
    }
    compositionWidth = maxWidth || 1920; // Default to 1920 if no media found
  }

  // Calculate composition height if not provided
  if (compositionHeight === null) {
    let maxHeight = 0;
    for (const item of timelineData) {
      for (const scrubber of item.scrubbers) {
        if (
          scrubber.media_height !== null &&
          scrubber.media_height > maxHeight
        ) {
          maxHeight = scrubber.media_height;
        }
      }
    }
    compositionHeight = maxHeight || 1080; // Default to 1080 if no media found
  }

  // Guard against invalid dimensions (e.g., user typed 0, only-audio timelines)
  const safeWidth =
    !compositionWidth || compositionWidth <= 0 ? 1920 : compositionWidth;
  const safeHeight =
    !compositionHeight || compositionHeight <= 0 ? 1080 : compositionHeight;
  const safeDuration = Math.max(1, durationInFrames || 1);

  return (
    <Player
      ref={ref}
      component={TimelineComposition}
      inputProps={{
        timelineData,
        durationInFrames,
        isRendering: false,
        selectedItem,
        setSelectedItem,
        timeline,
        handleUpdateScrubber,
        getPixelsPerSecond,
      }}
      durationInFrames={safeDuration}
      compositionWidth={safeWidth}
      compositionHeight={safeHeight}
      fps={30}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 1,
      }}
      acknowledgeRemotionLicense
    />
  );
}
