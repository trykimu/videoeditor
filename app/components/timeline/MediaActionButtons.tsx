import React from "react"

interface MediaActionButtonsProps {
  onAddMedia: () => void
  onAddText: () => void
}

export const MediaActionButtons: React.FC<MediaActionButtonsProps> = ({
  onAddMedia,
  onAddText,
}) => {
  return (
    <div className="flex space-x-2">
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
    </div>
  )
} 