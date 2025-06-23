import React from "react"

interface DimensionControlsProps {
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  isAutoSize: boolean
  onAutoSizeChange: (auto: boolean) => void
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
  isAutoSize,
  onAutoSizeChange,
}) => {
  return (
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
  )
} 