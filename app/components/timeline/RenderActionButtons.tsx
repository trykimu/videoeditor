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
        className={`px-4 py-2 rounded border transition-colors cursor-pointer ${
          isRendering
            ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 border-blue-500 text-white hover:bg-blue-500"
        }`}
      >
        {isRendering ? "Rendering" : "Render"}
      </button>
      <button
        onClick={onLogTimelineData}
        className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors cursor-pointer"
      >
        Stats
      </button>
    </div>
  )
} 