import React from "react"
import { type TimelineDataItem } from "./types"

interface TimelineControlsProps {
  onAddMedia: () => void
  onAddText: () => void
  onAddTrack: () => void
  onRenderVideo: () => void
  onLogTimelineData: () => void
  isRendering: boolean
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  onAddMedia,
  onAddText,
  onAddTrack,
  onRenderVideo,
  onLogTimelineData,
  isRendering,
}) => {
  return (
    <div className="flex justify-between items-center py-4 flex-shrink-0">
      <h2 className="text-2xl font-bold">Timeline</h2>
      <div className="space-x-2">
        <input
          type="file"
          accept="video/*,image/*"
          id="media-upload-input"
          className="hidden"
        />
        <button
          onClick={onAddMedia}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
        >
          Add Media
        </button>
        <button
          onClick={onAddText}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Add Text
        </button>
        <button
          onClick={onAddTrack}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Add Track
        </button>
        <button
          onClick={onRenderVideo}
          disabled={isRendering}
          className={`px-4 py-2 text-white rounded transition-colors ${
            isRendering
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {isRendering ? "Rendering..." : "Render Video"}
        </button>
        <button
          onClick={onLogTimelineData}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          Log Timeline Data
        </button>
      </div>
    </div>
  )
} 