import React from "react"

interface RenderStatusProps {
  renderStatus: string
}

export const RenderStatus: React.FC<RenderStatusProps> = ({ renderStatus }) => {
  if (!renderStatus) return null

  return (
    <div
      className={`mb-4 p-3 rounded-lg flex-shrink-0 ${
        renderStatus.startsWith("Error")
          ? "bg-red-100 text-red-700 border border-red-200"
          : renderStatus.includes("successfully")
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-blue-100 text-blue-700 border border-blue-200"
      }`}
    >
      {renderStatus}
    </div>
  )
} 