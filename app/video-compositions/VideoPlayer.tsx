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
  // console.log('Timeline Data => ', JSON.stringify(timelineData, null, 2));
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
  const FPS = 30; // Assuming 30 FPS as set in VideoPlayer

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
                  {scrubber.text?.textContent || "insert text here"}
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
        items.push(
          <Sequence
            from={Math.round(scrubber.startTime * FPS)}
            durationInFrames={Math.round(scrubber.duration * FPS)}
            key={scrubber.id}
          >
            {content}
          </Sequence>
        );
      }
    }
  }
  if (isRendering) {
    return <div>{items}</div>;
  } else {
    return (
      <AbsoluteFill
        style={{
          ...outer,
          backgroundColor: "transparent", // Ensure transparency for preview
          position: "absolute",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        }}
        onPointerDown={onPointerDown}
      >
        {items.length === 0 ? (
          // Show placeholder when no items
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}
          >
            <div
              style={{
                color: "rgb(161, 161, 170)",
                fontSize: "16px",
                fontFamily: "Inter, system-ui, sans-serif",
                textAlign: "center",
                padding: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                border: "1px dashed rgba(161, 161, 170, 0.3)",
              }}
            >
              Drop media or add text to get started
            </div>
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={layerContainer}>{items}</AbsoluteFill>
        )}
        {!isRendering && (
          <SortedOutlines
            handleUpdateScrubber={handleUpdateScrubber}
            selectedItem={selectedItem}
            timeline={timeline}
            setSelectedItem={setSelectedItem}
          />
        )}
      </AbsoluteFill>
    );
  }
  // return (
  //     <div>
  //         {items}
  //     </div>
  // )
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
      durationInFrames={durationInFrames || 30}
      compositionWidth={compositionWidth}
      compositionHeight={compositionHeight}
      fps={30}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        zIndex: 1,
        backgroundColor: "transparent", // Use transparent background to respect theme
      }}
      controls
    />
  );
}
