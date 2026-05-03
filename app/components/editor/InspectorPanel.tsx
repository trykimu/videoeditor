import React from "react";
import { Volume2, VolumeX, X, MousePointerClick } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { type ScrubberState } from "~/components/timeline/types";

interface InspectorPanelProps {
  selectedScrubberIds: string[];
  getAllScrubbers: () => ScrubberState[];
  pixelsPerSecond: number;
  onUpdate: (s: ScrubberState) => void;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4];

const MEDIA_TYPE_LABELS: Record<string, string> = {
  video: "Video",
  audio: "Audio",
  image: "Image",
  text: "Text",
  groupped_scrubber: "Group",
};

export function InspectorPanel({ selectedScrubberIds, getAllScrubbers, pixelsPerSecond, onUpdate, onClose }: InspectorPanelProps) {
  const scrubber = selectedScrubberIds.length === 1
    ? getAllScrubbers().find((s) => s.id === selectedScrubberIds[0]) ?? null
    : null;

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold">Inspector</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {!scrubber ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground px-4 text-center">
          <MousePointerClick className="h-6 w-6 opacity-40" />
          <p className="text-xs">Select a clip on the timeline to inspect its properties.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
          {/* Identity */}
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Clip</div>
            <div className="font-medium truncate" title={scrubber.name}>{scrubber.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {MEDIA_TYPE_LABELS[scrubber.mediaType] ?? scrubber.mediaType}
            </div>
          </div>

          <Separator />

          {/* Timing */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Timing</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Start", val: (scrubber.left / pixelsPerSecond).toFixed(2) + "s" },
                { label: "End", val: ((scrubber.left + scrubber.width) / pixelsPerSecond).toFixed(2) + "s" },
                { label: "Duration", val: (scrubber.width / pixelsPerSecond).toFixed(2) + "s" },
              ].map(({ label, val }) => (
                <div key={label} className="bg-muted/30 rounded p-1.5">
                  <div className="font-mono font-medium text-[11px]">{val}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Volume (audio/video only) */}
          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Volume</div>
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => onUpdate({ ...scrubber, muted: !scrubber.muted })}>
                    {scrubber.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={scrubber.muted ? 0 : (scrubber.volume ?? 1)}
                  onChange={(e) => onUpdate({ ...scrubber, volume: parseFloat(e.target.value), muted: false })}
                  className="w-full h-1 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span className="text-foreground font-medium">
                    {scrubber.muted ? "Muted" : `${Math.round((scrubber.volume ?? 1) * 100)}%`}
                  </span>
                  <span>100%</span>
                </div>
              </div>

              <Separator />

              {/* Speed */}
              <div className="space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Speed</div>
                <div className="flex gap-1.5 flex-wrap">
                  {SPEED_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => onUpdate({ ...scrubber, playbackRate: rate })}
                      className={`px-2.5 py-1 rounded border text-[10px] transition-colors ${
                        (scrubber.playbackRate ?? 1) === rate
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                      }`}>
                      {rate}×
                    </button>
                  ))}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Position in player (non-audio) */}
          {scrubber.mediaType !== "audio" && (
            <div className="space-y-2">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Player Position</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { label: "X", key: "left_player" as const },
                    { label: "Y", key: "top_player" as const },
                    { label: "Width", key: "width_player" as const },
                    { label: "Height", key: "height_player" as const },
                  ] as { label: string; key: keyof ScrubberState }[]
                ).map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">{label}</div>
                    <input
                      type="number"
                      value={Math.round(scrubber[key] as number)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) onUpdate({ ...scrubber, [key]: val });
                      }}
                      className="w-full h-6 px-2 text-[11px] bg-muted/30 border border-border/50 rounded focus:outline-none focus:border-primary font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
