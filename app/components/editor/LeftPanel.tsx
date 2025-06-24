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
    <div className="w-[280px] bg-gray-700 rounded flex flex-row h-full">
      {/* Vertical Tab Navigation */}
      <div className="flex flex-col border-r border-gray-700 bg-gray-800 rounded-l w-20 flex-shrink-0">
        {[
          { to: "/media-bin", label: "Media" },
          { to: "/text-editor", label: "Text" },
        ].map(tab => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`px-3 py-3 text-center text-xs border-b border-gray-700 font-medium transition-colors ${
              activeTab === tab.to.replace('/', '')
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-hidden min-w-0 bg-gray-700 rounded-r">
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