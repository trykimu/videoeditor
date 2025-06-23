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
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer"
    >
      Add Track
    </button>
  )
} 