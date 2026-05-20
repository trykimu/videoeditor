import React from "react";

interface ZoomSliderProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function ZoomSlider({ zoomLevel, onZoomIn, onZoomOut, onZoomReset }: ZoomSliderProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-xs h-6 w-6 font-mono transition-colors"
        onClick={onZoomOut}
        title="Zoom out (Ctrl+scroll)">
        −
      </button>
      <button
        type="button"
        className="text-xs font-mono text-muted-foreground hover:text-foreground h-6 min-w-[44px] px-1 rounded hover:bg-muted transition-colors"
        onClick={onZoomReset}
        title="Reset zoom">
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground text-xs h-6 w-6 font-mono transition-colors"
        onClick={onZoomIn}
        title="Zoom in (Ctrl+scroll)">
        +
      </button>
    </div>
  );
}
