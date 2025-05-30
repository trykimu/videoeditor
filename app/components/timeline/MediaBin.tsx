import React from "react"
import { type MediaBinItem } from "./types"

interface MediaBinProps {
  mediaBinItems: MediaBinItem[]
  onAddMedia: (file: File) => Promise<void>
  onAddText: () => void
}

export const MediaBin: React.FC<MediaBinProps> = ({
  mediaBinItems,
  onAddMedia,
  onAddText,
}) => {
  return (
    <div className="w-1/3 bg-gray-50 p-3 rounded-lg shadow border border-gray-200 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2">Media Bin</h3>
      <div className="space-y-2">
        {mediaBinItems.map(item => (
          <div
            key={item.id}
            className="p-2 bg-blue-100 border border-blue-300 rounded shadow-sm cursor-grab"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify(item));
              console.log("Dragging item:", item.name);
            }}
          >
            {item.mediaType === "video" ? "🎥" : item.mediaType === "image" ? "🖼️" : "📝"} {item.name}
            {item.durationInSeconds && ` (${item.durationInSeconds.toFixed(1)}s)`}
          </div>
        ))}
        {mediaBinItems.length === 0 && <p className="text-sm text-gray-500">Add media or text elements.</p>}
      </div>
    </div>
  )
} 