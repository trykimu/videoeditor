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
    <div className="w-full bg-gray-50 p-3 h-full overflow-y-auto">
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
            {item.mediaType === "video" && item.durationInSeconds > 0 && ` (${item.durationInSeconds.toFixed(2)}s)`}
          </div>
        ))}
        {mediaBinItems.length === 0 && <p className="text-sm text-gray-500">Add media or text elements.</p>}
      </div>
    </div>
  )
} 