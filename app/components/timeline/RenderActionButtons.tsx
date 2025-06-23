import React from "react"

interface RenderActionButtonsProps {
  onRenderVideo: () => void
  onLogTimelineData: () => void
  isRendering: boolean
}

export const RenderActionButtons: React.FC<RenderActionButtonsProps> = ({
  onRenderVideo,
  onLogTimelineData,
  isRendering,
}) => {
  return (
    <div className="flex space-x-2">
      <button
        onClick={onRenderVideo}
        disabled={isRendering}
        className={`px-4 py-2 text-white rounded transition-colors cursor-pointer ${
          isRendering
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
      >
        {isRendering ? "Rendering..." : "Render Video"}
      </button>
      <button
        onClick={onLogTimelineData}
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors cursor-pointer"
      >
        Log Timeline Data
      </button>
    </div>
  )
} 