import React from "react"
import { PIXELS_PER_SECOND, RULER_HEIGHT } from "./types"

interface TimelineRulerProps {
  timelineWidth: number
  rulerPositionPx: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onRulerDrag: (newPositionPx: number) => void
  onRulerMouseDown: (e: React.MouseEvent) => void
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  timelineWidth,
  rulerPositionPx,
  containerRef,
  onRulerDrag,
  onRulerMouseDown,
}) => {
  return (
    <div className="flex flex-shrink-0">
      {/* Delete buttons header */}
      <div className="bg-gray-50 border-r border-gray-300 flex-shrink-0" style={{ width: '60px' }}>
        <div style={{ height: `${RULER_HEIGHT}px` }} className="border-b-2 border-gray-400 bg-gray-200" />
      </div>

      {/* Timeline Ruler */}
      <div
        className="bg-gray-200 border-b-2 border-gray-400 cursor-pointer relative z-50 flex-1 overflow-hidden"
        style={{ height: `${RULER_HEIGHT}px` }}
      >
        <div
          className="absolute top-0 left-0"
          style={{
            width: `${timelineWidth}px`,
            height: `${RULER_HEIGHT}px`,
            transform: `translateX(-${containerRef.current?.scrollLeft || 0}px)`,
          }}
          onClick={(e) => {
            if (containerRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickXInRuler = e.clientX - rect.left;
              const newPositionPx = clickXInRuler + (containerRef.current.scrollLeft || 0);
              onRulerDrag(newPositionPx);
            }
          }}
        >
          {/* Ruler markings */}
          {Array.from({ length: Math.floor(timelineWidth / PIXELS_PER_SECOND) + 1 }, (_, index) => index).map((sec) => (
            <div key={`ruler-mark-${sec}`} className="absolute top-0 h-full flex flex-col justify-between pointer-events-none" style={{ left: `${sec * PIXELS_PER_SECOND}px` }}>
              {sec % 5 === 0 && <span className="text-sm text-gray-700 -ml-1.5 mt-1 bg-gray-200 px-1 rounded">{sec}s</span>}
              <div className={`w-px ${sec % 5 === 0 ? 'h-6 bg-gray-600' : 'h-3 bg-gray-400'} self-end`} />
            </div>
          ))}
          {/* Current Time Indicator on Ruler */}
          <div
            className="absolute top-1 transform -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-1 rounded-md shadow-lg cursor-pointer z-10 hover:bg-red-700 transition-colors"
            style={{ left: `${rulerPositionPx}px` }}
            onMouseDown={onRulerMouseDown}
          >
            {(rulerPositionPx / PIXELS_PER_SECOND).toFixed(2)}s
          </div>
        </div>
      </div>
    </div>
  )
} 