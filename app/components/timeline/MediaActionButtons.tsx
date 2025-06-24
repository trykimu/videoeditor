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
        className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors cursor-pointer"
      >
        Add Media
      </button>
      <button
        onClick={onAddText}
        className="px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded hover:bg-gray-600 hover:border-blue-500 hover:text-white transition-colors cursor-pointer"
      >
        Add Text
      </button>
    </div>
  )
} 