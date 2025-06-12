import React from "react"

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
      <h2 className="text-2xl font-bold">Timeline</h2>
      <div className="flex items-center space-x-4">
        {/* Aspect Ratio Controls */}
        <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <input
            type="number"
            value={width}
            onChange={(e) => onWidthChange(parseInt(e.target.value) || 1920)}
            disabled={isAutoSize}
            className={`w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isAutoSize ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''
            }`}
            min="1"
            max="7680"
          />
          <span className="text-gray-500">×</span>
          <input
            type="number"
            value={height}
            onChange={(e) => onHeightChange(parseInt(e.target.value) || 1080)}
            disabled={isAutoSize}
            className={`w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isAutoSize ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''
            }`}
            min="1"
            max="4320"
          />
          <div className="flex items-center space-x-1 ml-2">
            <input
              type="checkbox"
              id="auto-size"
              checked={isAutoSize}
              onChange={(e) => onAutoSizeChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="auto-size" className="text-sm font-medium text-gray-700 cursor-pointer">
              Auto
            </label>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-x-2">
          <input
            type="file"
            accept="video/*,image/*"
            id="media-upload-input"
            className="hidden"
          />
          <button
            onClick={onAddMedia}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors cursor-pointer"
          >
            Add Media
          </button>
          <button
            onClick={onAddText}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
          >
            Add Text
          </button>
          <button
            onClick={onAddTrack}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer"
          >
            Add Track
          </button>
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
      </div>
    </div>
  )
} 