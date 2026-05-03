import React from "react";
import { Volume2, VolumeX, MousePointerClick, Film, Image, Music, Type, Layers } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import { type ScrubberState } from "~/components/timeline/types";

interface InspectorPanelProps {
  selectedScrubberIds: string[];
  getAllScrubbers: () => ScrubberState[];
  pixelsPerSecond: number;
  onUpdate: (s: ScrubberState) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2, 4];

const MEDIA_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  video:             { label: "Video",  icon: Film,   color: "text-blue-400" },
  audio:             { label: "Audio",  icon: Music,  color: "text-purple-400" },
  image:             { label: "Image",  icon: Image,  color: "text-green-400" },
  text:              { label: "Text",   icon: Type,   color: "text-yellow-400" },
  groupped_scrubber: { label: "Group",  icon: Layers, color: "text-orange-400" },
};

function fmt(seconds: number) {
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toFixed(1);
    return `${m}m ${s}s`;
  }
  return `${seconds.toFixed(2)}s`;
}

export function InspectorPanel({ selectedScrubberIds, getAllScrubbers, pixelsPerSecond, onUpdate }: InspectorPanelProps) {
  const scrubber = selectedScrubberIds.length === 1
    ? getAllScrubbers().find((s) => s.id === selectedScrubberIds[0]) ?? null
    : null;

  const meta = scrubber ? (MEDIA_TYPE_META[scrubber.mediaType] ?? MEDIA_TYPE_META.video) : null;
  const Icon = meta?.icon;

  const startSec = scrubber ? scrubber.left / pixelsPerSecond : 0;
  const durationSec = scrubber ? scrubber.width / pixelsPerSecond : 0;
  const endSec = startSec + durationSec;

  return (
    <div data-no-deselect="true" className="h-full flex flex-col bg-background text-foreground select-none">
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold text-foreground">Inspector</span>
      </div>

      {!scrubber ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-5 text-center">
          <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center">
            <MousePointerClick className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Select a clip on the timeline to inspect and edit its properties
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Identity */}
          <div className="flex items-start gap-2.5">
            {Icon && (
              <div className="h-8 w-8 rounded-md bg-muted/40 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className={`h-4 w-4 ${meta?.color ?? "text-muted-foreground"}`} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate leading-tight" title={scrubber.name}>
                {scrubber.name}
              </div>
              <div className={`text-[10px] mt-0.5 ${meta?.color ?? "text-muted-foreground"}`}>
                {meta?.label ?? scrubber.mediaType}
              </div>
            </div>
          </div>

          <Separator />

          {/* Timing */}
          <div className="space-y-2">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Timing</div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Start",    val: fmt(startSec) },
                { label: "End",      val: fmt(endSec) },
                { label: "Duration", val: fmt(durationSec) },
              ].map(({ label, val }) => (
                <div key={label} className="bg-muted/30 rounded-md p-2 text-center border border-border/30">
                  <div className="font-mono font-medium text-[11px] text-foreground">{val}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {(scrubber.mediaType === "video" || scrubber.mediaType === "audio") && (
            <>
              <Separator />

              {/* Volume */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Volume</div>
                  <button
                    className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => onUpdate({ ...scrubber, muted: !scrubber.muted })}>
                    {scrubber.muted
                      ? <VolumeX className="h-3 w-3" />
                      : <Volume2 className="h-3 w-3" />}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={scrubber.muted ? 0 : (scrubber.volume ?? 1)}
                    onChange={(e) => onUpdate({ ...scrubber, volume: parseFloat(e.target.value), muted: false })}
                    className="w-full h-1.5 accent-primary cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>0%</span>
                    <span className={`font-medium tabular-nums ${scrubber.muted ? "text-muted-foreground" : "text-foreground"}`}>
                      {scrubber.muted ? "Muted" : `${Math.round((scrubber.volume ?? 1) * 100)}%`}
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Speed */}
              <div className="space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Playback Speed</div>
                <div className="grid grid-cols-3 gap-1">
                  {SPEED_OPTIONS.map((rate) => {
                    const active = (scrubber.playbackRate ?? 1) === rate;
                    return (
                      <button
                        key={rate}
                        onClick={() => onUpdate({ ...scrubber, playbackRate: rate })}
                        className={`py-1 rounded text-[10px] font-medium transition-colors border ${
                          active
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border/40 hover:border-border hover:bg-muted/40 text-muted-foreground"
                        }`}>
                        {rate}×
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {scrubber.mediaType !== "audio" && (
            <>
              <Separator />

              {/* Player Position */}
              <div className="space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Position &amp; Size</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { label: "X", key: "left_player" as const },
                      { label: "Y", key: "top_player" as const },
                      { label: "W", key: "width_player" as const },
                      { label: "H", key: "height_player" as const },
                    ] as { label: string; key: keyof ScrubberState }[]
                  ).map(({ label, key }) => (
                    <div key={key} className="flex items-center gap-1.5 bg-muted/30 border border-border/40 rounded px-2 h-7 focus-within:border-primary transition-colors">
                      <span className="text-[9px] text-muted-foreground w-3 shrink-0">{label}</span>
                      <input
                        type="number"
                        value={Math.round(scrubber[key] as number)}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) onUpdate({ ...scrubber, [key]: val });
                        }}
                        className="flex-1 w-0 bg-transparent text-[11px] font-mono text-foreground focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
