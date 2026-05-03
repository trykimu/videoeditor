import React, { useState, useCallback, useEffect } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { type TimelineDataItem, type TimelineState } from "~/components/timeline/types";
import { type RenderOptions } from "~/hooks/useRenderer";

interface ExportPanelProps {
  isRendering: boolean;
  renderProgress: number;
  timeline: TimelineState;
  timelineData: TimelineDataItem[];
  getTimelineData: () => TimelineDataItem[];
  getPixelsPerSecond: () => number;
  handleRenderVideo: (
    getTimelineData: () => TimelineDataItem[],
    timeline: TimelineState,
    compositionWidth: number | null,
    compositionHeight: number | null,
    getPixelsPerSecond: () => number,
    options?: RenderOptions,
  ) => void;
}

type QualityPreset = "web" | "balanced" | "high" | "lossless";
const QUALITY_CRF: Record<QualityPreset, number> = { web: 36, balanced: 28, high: 18, lossless: 0 };
const QUALITY_LABELS: Record<QualityPreset, string> = {
  web:      "Web",
  balanced: "Balanced",
  high:     "High",
  lossless: "Lossless",
};
const QUALITY_DESC: Record<QualityPreset, string> = {
  web:      "Smaller file, optimised for streaming",
  balanced: "Good balance of size and quality",
  high:     "Visually lossless, larger file",
  lossless: "No quality loss, largest file",
};

export function ExportPanel({
  isRendering,
  renderProgress,
  timeline,
  timelineData,
  getTimelineData,
  getPixelsPerSecond,
  handleRenderVideo,
}: ExportPanelProps) {
  const [codec, setCodec] = useState<"h264" | "h265" | "vp9">("h264");
  const [quality, setQuality] = useState<QualityPreset>("balanced");
  const [autoSize, setAutoSize] = useState(true);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [widthInput, setWidthInput] = useState("1920");
  const [heightInput, setHeightInput] = useState("1080");
  const [justFinished, setJustFinished] = useState(false);

  const wasRendering = React.useRef(false);
  useEffect(() => {
    if (wasRendering.current && !isRendering && renderProgress === 100) {
      setJustFinished(true);
      const t = setTimeout(() => setJustFinished(false), 3000);
      return () => clearTimeout(t);
    }
    wasRendering.current = isRendering;
  }, [isRendering, renderProgress]);

  const isEmpty = timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0);

  const handleExport = useCallback(() => {
    setJustFinished(false);
    handleRenderVideo(
      getTimelineData,
      timeline,
      autoSize ? null : width,
      autoSize ? null : height,
      getPixelsPerSecond,
      { codec, crf: QUALITY_CRF[quality] },
    );
  }, [handleRenderVideo, getTimelineData, timeline, autoSize, width, height, getPixelsPerSecond, codec, quality]);

  const outputExt = codec === "vp9" ? ".webm" : ".mp4";
  const disabled = isRendering || isEmpty;

  return (
    <div className="h-full flex flex-col bg-background text-foreground select-none">
      {/* Header */}
      <div className="flex items-center px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold">Export</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">

        {/* Progress / status during render */}
        {isRendering && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="uppercase tracking-wider font-medium">Rendering</span>
                </div>
                <span className="font-mono text-foreground tabular-nums">{renderProgress}%</span>
              </div>
              <Progress value={renderProgress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground">
                {renderProgress < 10 ? "Preparing composition…"
                  : renderProgress < 90 ? "Encoding frames…"
                  : "Uploading and finalising…"}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Success flash */}
        {justFinished && !isRendering && (
          <>
            <div className="flex items-center gap-2 text-green-500 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Export complete — download started</span>
            </div>
            <Separator />
          </>
        )}

        {/* Resolution */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolution</div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-size-export" className="text-xs text-muted-foreground">Auto (from timeline)</Label>
            <Switch
              id="auto-size-export"
              checked={autoSize}
              onCheckedChange={setAutoSize}
              disabled={isRendering}
              className="scale-75"
            />
          </div>
          {!autoSize && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={widthInput}
                disabled={isRendering}
                onChange={(e) => { setWidthInput(e.target.value); const n = Number(e.target.value); if (isFinite(n) && n > 0) setWidth(n); }}
                onBlur={() => { const n = Number(widthInput); const s = isFinite(n) && n > 0 ? n : 1920; setWidth(s); setWidthInput(String(s)); }}
                className="h-7 text-xs"
                placeholder="1920"
              />
              <span className="text-muted-foreground shrink-0 text-[11px]">×</span>
              <Input
                type="number"
                value={heightInput}
                disabled={isRendering}
                onChange={(e) => { setHeightInput(e.target.value); const n = Number(e.target.value); if (isFinite(n) && n > 0) setHeight(n); }}
                onBlur={() => { const n = Number(heightInput); const s = isFinite(n) && n > 0 ? n : 1080; setHeight(s); setHeightInput(String(s)); }}
                className="h-7 text-xs"
                placeholder="1080"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Codec */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Format</div>
          <Select value={codec} onValueChange={(v) => setCodec(v as typeof codec)} disabled={isRendering}>
            <SelectTrigger size="sm" className="w-full text-xs h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h264">H.264 — MP4 <span className="text-muted-foreground text-[10px]">(most compatible)</span></SelectItem>
              <SelectItem value="h265">H.265 / HEVC — MP4 <span className="text-muted-foreground text-[10px]">(better compression)</span></SelectItem>
              <SelectItem value="vp9">VP9 — WebM <span className="text-muted-foreground text-[10px]">(open source)</span></SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] text-muted-foreground">Output: <span className="font-mono text-foreground">{outputExt}</span></div>
        </div>

        <Separator />

        {/* Quality */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quality</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(QUALITY_LABELS) as QualityPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => !isRendering && setQuality(preset)}
                disabled={isRendering}
                className={`px-2 py-2 rounded border text-[10px] text-left transition-colors leading-tight ${
                  quality === preset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 hover:border-border hover:bg-muted/40 text-muted-foreground disabled:cursor-not-allowed"
                }`}>
                <div className="font-medium">{QUALITY_LABELS[preset]}</div>
                <div className={`text-[9px] mt-0.5 ${quality === preset ? "text-primary/70" : "text-muted-foreground/60"}`}>
                  {QUALITY_DESC[preset]}
                </div>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground">
            CRF <span className="font-mono text-foreground">{QUALITY_CRF[quality]}</span>
            {quality === "lossless" && " — lossless mode (very large files)"}
          </div>
        </div>

      </div>

      {/* Export button */}
      <div className="px-3 py-3 border-t border-border/50 shrink-0 space-y-1.5">
        <Button
          className="w-full h-8 text-xs"
          onClick={handleExport}
          disabled={disabled}>
          {isRendering
            ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rendering… {renderProgress}%</>
            : <><Download className="h-3.5 w-3.5 mr-1.5" />Export Video</>}
        </Button>
        {isEmpty && !isRendering && (
          <p className="text-[10px] text-muted-foreground text-center">Add clips to the timeline first</p>
        )}
      </div>
    </div>
  );
}
