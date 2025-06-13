import React from "react"
import { Link, Outlet, useLocation } from "react-router"
import { type MediaBinItem } from "~/components/timeline/types"

interface LeftPanelProps {
  mediaBinItems: MediaBinItem[]
  onAddMedia: (file: File) => Promise<void>
  onAddText: (textContent: string, fontSize: number, fontFamily: string, color: string, textAlign: "left" | "center" | "right", fontWeight: "normal" | "bold") => void
}

export default function LeftPanel({ mediaBinItems, onAddMedia, onAddText }: LeftPanelProps) {
  const location = useLocation()
  
  // Determine active tab based on current route
  const getActiveTab = () => {
    if (location.pathname.includes('/media-bin')) return 'media-bin'
    if (location.pathname.includes('/text-editor')) return 'text-editor'
    return 'media-bin' // default
  }
  
  const activeTab = getActiveTab()
  
  return (
    <div className="w-1/3 bg-gray-50 rounded-lg shadow border border-gray-200 flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-300 bg-gray-100 rounded-t-lg">
        <Link
          to="/media-bin"
          className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
            activeTab === 'media-bin'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>🗂️</span>
            Media Bin
          </span>
        </Link>
        <Link
          to="/text-editor"
          className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
            activeTab === 'text-editor'
              ? 'bg-white text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span>📝</span>
            Text Editor
          </span>
        </Link>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet context={{
          // MediaBin props
          mediaBinItems,
          onAddMedia,
          onAddText,
        }} />
      </div>
    </div>
  )
} 