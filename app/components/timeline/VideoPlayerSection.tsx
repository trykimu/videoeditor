import React from "react"
import { VideoPlayer } from "~/video-compositions/VideoPlayer"
import type { PlayerRef } from "@remotion/player"
import type { VideoPlayerProps } from "./types"

export const VideoPlayerSection: React.FC<VideoPlayerProps> = ({
  timelineData,
  durationInFrames,
  ref,
  compositionWidth,
  compositionHeight,
}) => {
  return (
    <div className="w-2/3 bg-gray-900 rounded-lg overflow-hidden shadow">
      <VideoPlayer
        timelineData={timelineData}
        durationInFrames={durationInFrames}
        ref={ref}
        compositionWidth={compositionWidth}
        compositionHeight={compositionHeight}
      />
    </div>
  )
}