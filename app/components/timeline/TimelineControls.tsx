import React from "react"
import { TimelineTitle } from "./TimelineTitle"
import { DimensionControls } from "./DimensionControls"
import { MediaActionButtons } from "./MediaActionButtons"
import { TrackActionButton } from "./TrackActionButton"
import { RenderActionButtons } from "./RenderActionButtons"

interface TimelineControlsProps {
  onAddMedia: () => void
  onAddText: () => void
  onAddTrack: () => void
  onRenderVideo: () => void
  onLogTimelineData: () => void
  isRendering: boolean
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  isAutoSize: boolean
  onAutoSizeChange: (auto: boolean) => void
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  onAddMedia,
  onAddText,
  onAddTrack,
  onRenderVideo,
  onLogTimelineData,
  isRendering,
  width,
  height,
  onWidthChange,
  onHeightChange,
  isAutoSize,
  onAutoSizeChange,
}) => {
  return (
    <div className="flex justify-between items-center py-4 flex-shrink-0">
      <TimelineTitle />
      <div className="flex items-center space-x-4">
        {/* Aspect Ratio Controls */}
        <DimensionControls
          width={width}
          height={height}
          onWidthChange={onWidthChange}
          onHeightChange={onHeightChange}
          isAutoSize={isAutoSize}
          onAutoSizeChange={onAutoSizeChange}
        />
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <MediaActionButtons
            onAddMedia={onAddMedia}
            onAddText={onAddText}
          />
          <TrackActionButton onAddTrack={onAddTrack} />
          <RenderActionButtons
            onRenderVideo={onRenderVideo}
            onLogTimelineData={onLogTimelineData}
            isRendering={isRendering}
          />
        </div>
      </div>
    </div>
  )
} 