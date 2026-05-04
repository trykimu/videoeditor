import React, { useCallback } from "react";
import { MIN_ZOOM, MAX_ZOOM } from "../types";

interface ZoomSliderProps {
  zoomLevel: number;
  onSetZoom: (level: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

function zoomToSlider(zoom: number): number {
  const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
  return Math.log(clamped / MIN_ZOOM) / Math.log(MAX_ZOOM / MIN_ZOOM);
}

function sliderToZoom(sliderValue: number): number {
  return MIN_ZOOM * (MAX_ZOOM / MIN_ZOOM) ** sliderValue;
}

export function ZoomSlider({ zoomLevel, onSetZoom, onZoomIn, onZoomOut, onZoomReset }: ZoomSliderProps) {
  const sliderValue = zoomToSlider(zoomLevel);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newZoom = sliderToZoom(parseFloat(e.target.value));
      onSetZoom(newZoom);
    },
    [onSetZoom],
  );

  return (
    <div className="flex items-center gap-1.5">
      <button
        className="text-muted-foreground hover:text-foreground text-xs px-1 font-mono transition-colors"
        onClick={onZoomOut}
        title="Zoom out">
        −
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={sliderValue}
        onChange={handleChange}
        className="w-20 h-1 accent-primary cursor-pointer"
        style={{ WebkitAppearance: "none", appearance: "none" }}
      />

      <button
        className="text-muted-foreground hover:text-foreground text-xs px-1 font-mono transition-colors"
        onClick={onZoomIn}
        title="Zoom in">
        +
      </button>

      <button
        className="text-xs font-mono text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors min-w-[40px] text-center"
        onClick={onZoomReset}
        title="Reset zoom">
        {Math.round(zoomLevel * 100)}%
      </button>
    </div>
  );
}
