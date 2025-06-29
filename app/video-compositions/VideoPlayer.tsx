import { Player, type PlayerRef } from "@remotion/player";
import { Sequence, AbsoluteFill, Img, Video } from "remotion";
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

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }
      setSelectedItem(null);
    },
    [setSelectedItem]
  );

  // Temporary array to store items with trackIndex for sorting
  const tempItems: { content: React.ReactNode; trackIndex: number }[] = [];

  for (const timeline of timelineData) {
    for (const scrubber of timeline.scrubbers) {
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
        tempItems.push({
          content: (
            <Sequence
              from={Math.round(scrubber.startTime * FPS)}
              durationInFrames={Math.round(scrubber.duration * FPS)}
              key={scrubber.id}
            >
              {content}
            </Sequence>
          ),
          trackIndex: scrubber.trackIndex,
        });
      }
    }
  }

  // Sort by trackIndex (ascending) and push to items
  const items: React.ReactNode[] = tempItems
    .sort((a, b) => a.trackIndex - b.trackIndex)
    .map(item => item.content);

  if (isRendering) {
    return (
      <AbsoluteFill style={outer}>
        <AbsoluteFill style={layerContainer}>{items}</AbsoluteFill>
      </AbsoluteFill>
    );
  } else {
    return (
      <AbsoluteFill style={outer} onPointerDown={onPointerDown}>
        <AbsoluteFill style={layerContainer}>{items}</AbsoluteFill>
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
      acknowledgeRemotionLicense
    />
  );
}