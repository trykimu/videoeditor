import React, { useState, useCallback } from "react";
import { Download, X } from "lucide-react";
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
  onClose: () => void;
}

type QualityPreset = "web" | "balanced" | "high" | "lossless";
const QUALITY_CRF: Record<QualityPreset, number> = {
  web: 36,
  balanced: 28,
  high: 18,
  lossless: 0,
};
const QUALITY_LABELS: Record<QualityPreset, string> = {
  web: "Web (fast, smaller file)",
  balanced: "Balanced",
  high: "High quality",
  lossless: "Lossless",
};

export function ExportPanel({
  isRendering,
  renderProgress,
  timeline,
  timelineData,
  getTimelineData,
  getPixelsPerSecond,
  handleRenderVideo,
  onClose,
}: ExportPanelProps) {
  const [codec, setCodec] = useState<"h264" | "h265" | "vp9">("h264");
  const [quality, setQuality] = useState<QualityPreset>("balanced");
  const [autoSize, setAutoSize] = useState(true);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [widthInput, setWidthInput] = useState("1920");
  const [heightInput, setHeightInput] = useState("1080");

  const isEmpty = timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0);

  const handleExport = useCallback(() => {
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

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold">Export</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
        {/* Resolution */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Resolution</div>
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-size-export" className="text-xs">Auto (from timeline)</Label>
            <Switch
              id="auto-size-export"
              checked={autoSize}
              onCheckedChange={setAutoSize}
              className="scale-75"
            />
          </div>
          {!autoSize && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={widthInput}
                onChange={(e) => {
                  setWidthInput(e.target.value);
                  const n = Number(e.target.value);
                  if (isFinite(n) && n > 0) setWidth(n);
                }}
                onBlur={() => {
                  const n = Number(widthInput);
                  const safe = isFinite(n) && n > 0 ? n : 1920;
                  setWidth(safe);
                  setWidthInput(String(safe));
                }}
                className="h-7 text-xs"
                placeholder="1920"
              />
              <span className="text-muted-foreground shrink-0">×</span>
              <Input
                type="number"
                value={heightInput}
                onChange={(e) => {
                  setHeightInput(e.target.value);
                  const n = Number(e.target.value);
                  if (isFinite(n) && n > 0) setHeight(n);
                }}
                onBlur={() => {
                  const n = Number(heightInput);
                  const safe = isFinite(n) && n > 0 ? n : 1080;
                  setHeight(safe);
                  setHeightInput(String(safe));
                }}
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
          <Select value={codec} onValueChange={(v) => setCodec(v as typeof codec)}>
            <SelectTrigger size="sm" className="w-full text-xs h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h264">H.264 — MP4 (most compatible)</SelectItem>
              <SelectItem value="h265">H.265 / HEVC — MP4 (better compression)</SelectItem>
              <SelectItem value="vp9">VP9 — WebM (open source)</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] text-muted-foreground">Output: {outputExt}</div>
        </div>

        <Separator />

        {/* Quality */}
        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quality</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(QUALITY_LABELS) as QualityPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setQuality(preset)}
                className={`px-2 py-1.5 rounded border text-[10px] text-left transition-colors ${
                  quality === preset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-border/80 hover:bg-muted/50 text-muted-foreground"
                }`}>
                {QUALITY_LABELS[preset]}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground">
            CRF {QUALITY_CRF[quality]} — {quality === "lossless" ? "no quality loss" : quality === "web" ? "optimized for streaming" : quality === "high" ? "visually lossless" : "good balance of size/quality"}
          </div>
        </div>

        <Separator />

        {/* Render progress */}
        {isRendering && (
          <div className="space-y-2">
            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Progress</div>
            <Progress value={renderProgress} className="h-1.5" />
            <div className="text-[10px] text-muted-foreground text-right">{renderProgress}%</div>
          </div>
        )}
      </div>

      {/* Export button */}
      <div className="px-3 py-3 border-t border-border/50 shrink-0">
        <Button
          className="w-full h-8 text-xs"
          onClick={handleExport}
          disabled={isRendering || isEmpty}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {isRendering ? `Rendering… ${renderProgress}%` : "Export Video"}
        </Button>
        {isEmpty && (
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Add clips to the timeline first</p>
        )}
      </div>
    </div>
  );
}
