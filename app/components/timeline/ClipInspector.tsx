import React from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import { type ScrubberState } from "./types";

interface ClipInspectorProps {
  scrubber: ScrubberState;
  pixelsPerSecond: number;
  onUpdate: (s: ScrubberState) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4];

export const ClipInspector: React.FC<ClipInspectorProps> = ({ scrubber, pixelsPerSecond, onUpdate, onClose }) => {
  const startTime = scrubber.left / pixelsPerSecond;
  const endTime = (scrubber.left + scrubber.width) / pixelsPerSecond;
  const duration = endTime - startTime;
  const hasAudio = scrubber.mediaType === "video" || scrubber.mediaType === "audio";

  return (
    <div className="w-56 bg-popover border border-border rounded-md shadow-xl text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border/50">
        <span className="font-medium truncate max-w-[160px]" title={scrubber.name}>
          {scrubber.name}
        </span>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors ml-1 shrink-0"
          onClick={onClose}>
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="px-2 py-2 flex flex-col gap-2">
        {/* Timing */}
        <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
          <div>
            <div className="font-medium text-foreground">{startTime.toFixed(2)}s</div>
            <div>start</div>
          </div>
          <div>
            <div className="font-medium text-foreground">{endTime.toFixed(2)}s</div>
            <div>end</div>
          </div>
          <div>
            <div className="font-medium text-foreground">{duration.toFixed(2)}s</div>
            <div>duration</div>
          </div>
        </div>

        {/* Volume (audio/video only) */}
        {hasAudio && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Volume</span>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onUpdate({ ...scrubber, muted: !scrubber.muted })}>
                {scrubber.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={scrubber.muted ? 0 : (scrubber.volume ?? 1)}
              onChange={(e) =>
                onUpdate({ ...scrubber, volume: parseFloat(e.target.value), muted: false })
              }
              className="w-full h-1 accent-primary cursor-pointer"
            />
            <div className="text-[10px] text-muted-foreground text-right mt-0.5">
              {scrubber.muted ? "muted" : `${Math.round((scrubber.volume ?? 1) * 100)}%`}
            </div>
          </div>
        )}

        {/* Speed (audio/video only) */}
        {hasAudio && (
          <div>
            <div className="text-muted-foreground mb-1">Speed</div>
            <div className="flex gap-0.5 flex-wrap">
              {SPEED_OPTIONS.map((rate) => (
                <button
                  key={rate}
                  className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                    (scrubber.playbackRate ?? 1) === rate
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                  onClick={() => onUpdate({ ...scrubber, playbackRate: rate })}>
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player position (non-audio) */}
        {scrubber.mediaType !== "audio" && (
          <div>
            <div className="text-muted-foreground mb-1">Position</div>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { label: "X", key: "left_player" as const },
                  { label: "Y", key: "top_player" as const },
                  { label: "W", key: "width_player" as const },
                  { label: "H", key: "height_player" as const },
                ] as { label: string; key: keyof ScrubberState }[]
              ).map(({ label, key }) => (
                <label key={key} className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground w-3 shrink-0">{label}</span>
                  <input
                    type="number"
                    value={Math.round(scrubber[key] as number)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) onUpdate({ ...scrubber, [key]: val });
                    }}
                    className="w-full h-5 px-1 text-[10px] bg-muted/50 border border-border/50 rounded focus:outline-none focus:border-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
