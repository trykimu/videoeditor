import { useOutletContext } from "react-router"
import { type MediaBinItem } from "./types"

interface MediaBinProps {
  mediaBinItems: MediaBinItem[]
  onAddMedia: (file: File) => Promise<void>
  onAddText: (textContent: string, fontSize: number, fontFamily: string, color: string, textAlign: "left" | "center" | "right", fontWeight: "normal" | "bold") => void
}

// This is required for the data router
export function loader() {
  return null
}

export default function MediaBin() {
  const { mediaBinItems, onAddMedia, onAddText } = useOutletContext<MediaBinProps>()
  
  return (
    <div className="w-full h-full bg-gray-700 p-3 overflow-y-auto">
      <h3 className="text-sm font-medium mb-3 text-gray-200">Media Bin</h3>
      <div className="space-y-2">
        {mediaBinItems.map(item => (
          <div
            key={item.id}
            className="p-2 bg-gray-600 border border-gray-500 rounded cursor-grab hover:bg-gray-500 transition-colors text-xs"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", JSON.stringify(item));
              console.log("Dragging item:", item.name);
            }}
          >
            <div className="flex items-center gap-2">
              <span className="truncate text-gray-200">{item.name}</span>
            </div>
            {item.mediaType === "video" && item.durationInSeconds > 0 && (
              <div className="text-xs text-gray-400 mt-1">{item.durationInSeconds.toFixed(2)}s</div>
            )}
          </div>
        ))}
        {mediaBinItems.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400">No media files</p>
          </div>
        )}
      </div>
    </div>
  )
} 