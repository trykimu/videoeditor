import React from "react"

interface TrackActionButtonProps {
  onAddTrack: () => void
}

export const TrackActionButton: React.FC<TrackActionButtonProps> = ({
  onAddTrack,
}) => {
  return (
    <button
      onClick={onAddTrack}
      className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors cursor-pointer"
    >
      Track
    </button>
  )
} 