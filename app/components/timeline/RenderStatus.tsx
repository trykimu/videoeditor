import React from "react"

interface RenderStatusProps {
  renderStatus: string
}

export const RenderStatus: React.FC<RenderStatusProps> = ({ renderStatus }) => {
  if (!renderStatus) return null

  return (
    <div
      className={`p-3 rounded flex-shrink-0 text-sm ${
        renderStatus.startsWith("Error")
          ? "bg-red-900/50 text-red-300 border border-red-700"
          : renderStatus.includes("successfully")
          ? "bg-green-900/50 text-green-300 border border-green-700"
          : "bg-blue-900/50 text-blue-300 border border-blue-700"
      }`}
    >
      {renderStatus}
    </div>
  )
} 