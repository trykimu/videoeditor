import { Player, type PlayerRef } from "@remotion/player";
import { Sequence, AbsoluteFill, Img, Video, useCurrentFrame } from "remotion";
import React, { useCallback, useState } from "react";
import type {
  ScrubberState,
  TimelineDataItem,
  TimelineState,
  TrackState,
} from "~/components/timeline/types";
import { SortedOutlines, layerContainer, outer } from "./DragDrop";

type TimelineCompositionProps = {
  timelineData: TimelineDataItem[];
  isRendering: boolean; // it's either render (True) or preview (False)
  selectedItem: string | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<string | null>>;
  timeline: TimelineState;
  handleUpdateScrubber: (updateScrubber: ScrubberState) => void;
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
};

export function TimelineComposition({
  timelineData,
  isRendering,
  selectedItem,
  setSelectedItem,
  timeline,
  handleUpdateScrubber,
}: TimelineCompositionProps) {
  const FPS = 30; // Must match the Player fps setting
  const currentFrame = useCurrentFrame();

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }
      setSelectedItem(null);
    },
    [setSelectedItem]
  );

  // for this experiment it is all text that we are working with.
  const items: React.ReactNode[] = [];
  const allItems: React.ReactNode[] = []; // For drag and drop outlines

  for (const timeline of timelineData) {
    for (const scrubber of timeline.scrubbers) {
      const startFrame = Math.round(scrubber.startTime * FPS);
      const durationInFrames = Math.round(scrubber.duration * FPS);
      const endFrame = startFrame + durationInFrames;

      // Check if the current frame is within the sequence's active range
      const isActiveAtCurrentFrame =
        currentFrame >= startFrame && currentFrame < endFrame;

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
                    fontFamily:
                      scrubber.text?.fontFamily || "Arial, sans-serif",
                    fontWeight: scrubber.text?.fontWeight || "normal",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
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
            ? scrubber.mediaUrlRemote
            : scrubber.mediaUrlLocal;
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
            ? scrubber.mediaUrlRemote
            : scrubber.mediaUrlLocal;
          content = (
            <AbsoluteFill
              style={{
                left: scrubber.left_player,
                top: scrubber.top_player,
                width: scrubber.width_player,
                height: scrubber.height_player,
              }}
            >
              <Video src={videoUrl!} />
            </AbsoluteFill>
          );
          break;
        }

        default:
          console.warn(`Unknown media type: ${scrubber.mediaType}`);
          break;
      }

      if (content) {
        const sequenceElement = (
          <Sequence
            from={startFrame}
            durationInFrames={durationInFrames}
            key={scrubber.id}
          >
            {content}
          </Sequence>
        );

        // Always add to allItems for drag and drop functionality
        allItems.push(sequenceElement);

        // Only add to items if the sequence is active at the current frame (for visual rendering)
        if (isActiveAtCurrentFrame || isRendering) {
          items.push(sequenceElement);
        }
      }
    }
  }

  if (isRendering) {
    return <AbsoluteFill>{items}</AbsoluteFill>;
  } else {
    return (
      <AbsoluteFill style={outer} onPointerDown={onPointerDown}>
        <AbsoluteFill style={layerContainer}>
          {items}
          {/* Show a subtle indicator when no media is active at current frame */}
          {items.length === 0 && (
            <AbsoluteFill
              style={{
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.1)",
                  fontSize: "12px",
                  fontFamily: "Arial, sans-serif",
                  textAlign: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                No media at current time
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
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
}: VideoPlayerProps) {
  // console.log('timelineData from videoplayer', JSON.stringify(timelineData, null, 2))
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

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
      }}
      durationInFrames={durationInFrames || 10}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      fps={30}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 1,
      }}
      controls
      acknowledgeRemotionLicense
    />
  );
}
