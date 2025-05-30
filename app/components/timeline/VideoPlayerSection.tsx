import React from "react"
import { VideoPlayer } from "~/remotion/VideoPlayer"
import type { PlayerRef } from "@remotion/player"
import { type TimelineDataItem } from "./types"

interface VideoPlayerSectionProps {
  timelineData: TimelineDataItem[]
  durationInFrames: number
  playerRef: React.RefObject<PlayerRef | null>
}

export const VideoPlayerSection: React.FC<VideoPlayerSectionProps> = ({
  timelineData,
  durationInFrames,
  playerRef,
}) => {
  return (
    <div className="w-2/3 bg-gray-900 rounded-lg overflow-hidden shadow">
      <VideoPlayer
        timelineData={timelineData}
        durationInFrames={durationInFrames}
        ref={playerRef}
      />
    </div>
  )
}