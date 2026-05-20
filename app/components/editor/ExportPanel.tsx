import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Download, Loader2, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";
import { type TimelineDataItem, type TimelineState } from "~/components/timeline/types";
import { type RenderOptions } from "~/hooks/useRenderer";
import { useExportHistory } from "~/hooks/useExportHistory";
import { ExportHistory } from "./ExportHistory";
import {
  capExportDimensions,
  clampExportCrf,
  defaultExportFileName,
  formatResolutionLabel,
  sanitizeExportFileName,
  X264_PRESETS,
  type ExportResolutionPreset,
  type X264Preset,
} from "~/lib/render-settings";

interface ExportPanelProps {
  projectId?: string;
  projectName?: string;
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

type QualityPreset = "web" | "balanced" | "high";
const QUALITY_CRF: Record<QualityPreset, number> = { web: 32, balanced: 28, high: 23 };
const QUALITY_LABELS: Record<QualityPreset, string> = {
  web: "Web",
  balanced: "Balanced",
  high: "High",
};
const QUALITY_DESC: Record<QualityPreset, string> = {
  web: "Smaller file, good for sharing",
  balanced: "Recommended default",
  high: "Sharper detail, larger file",
};

const RESOLUTION_PRESETS: { id: ExportResolutionPreset; label: string }[] = [
  { id: "1080p", label: "1080p (recommended)" },
  { id: "720p", label: "720p" },
  { id: "source", label: "Source (max 1080p)" },
  { id: "4k", label: "4K" },
];

const X264_PRESET_LABELS: Record<X264Preset, string> = {
  ultrafast: "Ultrafast — fastest, largest",
  superfast: "Superfast",
  veryfast: "Very fast (recommended)",
  faster: "Faster",
  fast: "Fast",
  medium: "Medium — slower, smaller",
};

function sourceDimensions(timelineData: TimelineDataItem[]): { w: number; h: number } {
  let w = 1920;
  let h = 1080;
  for (const item of timelineData) {
    for (const s of item.scrubbers) {
      if (s.media_width && s.media_width > w) w = s.media_width;
      if (s.media_height && s.media_height > h) h = s.media_height;
    }
  }
  return { w, h };
}

export function ExportPanel({
  projectId,
  projectName = "",
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
  const [resolutionPreset, setResolutionPreset] = useState<ExportResolutionPreset>("1080p");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedCrf, setAdvancedCrf] = useState(23);
  const [jpegQuality, setJpegQuality] = useState(80);
  const [x264Preset, setX264Preset] = useState<X264Preset>("veryfast");
  const [exportAudio, setExportAudio] = useState(true);
  const [fileNameBase, setFileNameBase] = useState("");
  const [justFinished, setJustFinished] = useState(false);

  const { items: historyItems, loading: historyLoading, refetch: refetchHistory } =
    useExportHistory(projectId);

  const outputExt = codec === "vp9" ? ".webm" : ".mp4";

  useEffect(() => {
    setFileNameBase(defaultExportFileName(projectName, outputExt).replace(/\.(mp4|webm)$/i, ""));
  }, [projectName, outputExt]);

  const source = useMemo(() => sourceDimensions(timelineData), [timelineData]);
  const outputSize = useMemo(
    () => capExportDimensions(source.w, source.h, resolutionPreset),
    [source.w, source.h, resolutionPreset],
  );

  const fullFileName = useMemo(
    () => sanitizeExportFileName(fileNameBase || "export", outputExt),
    [fileNameBase, outputExt],
  );

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

  const buildOptions = useCallback((): RenderOptions | null => {
    if (!projectId) return null;
    const base = {
      projectId,
      onComplete: () => void refetchHistory(),
    };
    if (advancedOpen) {
      return {
        ...base,
        codec,
        crf: clampExportCrf(advancedCrf, true),
        resolutionPreset,
        outputFileName: fullFileName,
        advancedMode: true,
        jpegQuality,
        x264Preset: codec === "h264" ? x264Preset : undefined,
        muted: !exportAudio,
      };
    }
    return {
      ...base,
      codec,
      crf: QUALITY_CRF[quality],
      resolutionPreset,
      outputFileName: fullFileName,
      advancedMode: false,
      muted: !exportAudio,
    };
  }, [
    projectId,
    refetchHistory,
    advancedOpen,
    codec,
    advancedCrf,
    quality,
    resolutionPreset,
    fullFileName,
    jpegQuality,
    x264Preset,
    exportAudio,
  ]);

  const handleExport = useCallback(() => {
    const opts = buildOptions();
    if (!opts) {
      toast.error("Save the project before exporting");
      return;
    }
    setJustFinished(false);
    handleRenderVideo(getTimelineData, timeline, source.w, source.h, getPixelsPerSecond, opts);
  }, [handleRenderVideo, getTimelineData, timeline, source.w, source.h, getPixelsPerSecond, buildOptions]);

  const disabled = isRendering || isEmpty;
  const show4kWarning = resolutionPreset === "4k";
  const effectiveCrf = advancedOpen ? clampExportCrf(advancedCrf, true) : QUALITY_CRF[quality];

  return (
    <div className="h-full flex flex-col bg-background text-foreground select-none">
      <div className="flex items-center px-3 py-2 border-b border-border/50 shrink-0">
        <span className="text-xs font-semibold">Export</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
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
                {renderProgress < 10
                  ? "Preparing composition…"
                  : renderProgress < 90
                    ? "Encoding frames…"
                    : "Uploading and finalising…"}
              </p>
            </div>
            <Separator />
          </>
        )}

        {justFinished && !isRendering && (
          <>
            <div className="flex items-center gap-2 text-green-500 text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Export complete — download started</span>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            File name
          </div>
          <div className="flex items-center gap-1">
            <Input
              value={fileNameBase}
              disabled={isRendering}
              onChange={(e) => setFileNameBase(e.target.value)}
              onBlur={() => setFileNameBase((v) => v.trim() || "export")}
              className="h-7 text-xs flex-1"
              placeholder="my-video"
            />
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">{outputExt}</span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate" title={fullFileName}>
            Saves as <span className="font-mono text-foreground">{fullFileName}</span>
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Resolution
          </div>
          <Select
            value={resolutionPreset}
            onValueChange={(v) => setResolutionPreset(v as ExportResolutionPreset)}
            disabled={isRendering}>
            <SelectTrigger size="sm" className="w-full text-xs h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            {formatResolutionLabel(source.w, source.h)} →{" "}
            <span className="font-mono text-foreground">
              {formatResolutionLabel(outputSize.width, outputSize.height)}
            </span>
          </p>
          {show4kWarning && (
            <p className="text-[10px] text-amber-600/90 flex items-start gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
              4K needs more server RAM. Use 1080p if export fails.
            </p>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Format</div>
          <Select value={codec} onValueChange={(v) => setCodec(v as typeof codec)} disabled={isRendering}>
            <SelectTrigger size="sm" className="w-full text-xs h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h264" className="text-xs">
                H.264 — MP4 (most compatible)
              </SelectItem>
              <SelectItem value="h265" className="text-xs">
                H.265 / HEVC — MP4
              </SelectItem>
              <SelectItem value="vp9" className="text-xs">
                VP9 — WebM
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="export-audio" className="text-xs text-muted-foreground">
            Include audio
          </Label>
          <Switch
            id="export-audio"
            checked={exportAudio}
            onCheckedChange={setExportAudio}
            disabled={isRendering}
            className="scale-75"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            onClick={() => setAdvancedOpen((o) => !o)}
            disabled={isRendering}>
            <span>Encoding</span>
            <span className="flex items-center gap-1 normal-case font-normal text-muted-foreground">
              {advancedOpen ? "Advanced" : "Quality presets"}
              {advancedOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          </button>

          {!advancedOpen ? (
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(QUALITY_LABELS) as QualityPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => !isRendering && setQuality(preset)}
                  disabled={isRendering}
                  className={`px-2 py-2 rounded border text-[10px] text-left transition-colors leading-tight ${
                    quality === preset
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 hover:border-border hover:bg-muted/40 text-muted-foreground disabled:cursor-not-allowed"
                  }`}>
                  <div className="font-medium">{QUALITY_LABELS[preset]}</div>
                  <div
                    className={`text-[9px] mt-0.5 ${quality === preset ? "text-primary/70" : "text-muted-foreground/60"}`}>
                    CRF {QUALITY_CRF[preset]}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-border/50 bg-muted/20 p-2.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">CRF (16–51)</Label>
                  <span className="font-mono text-[10px] text-foreground">{effectiveCrf}</span>
                </div>
                <input
                  type="range"
                  min={16}
                  max={51}
                  step={1}
                  value={advancedCrf}
                  disabled={isRendering}
                  onChange={(e) => setAdvancedCrf(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary"
                />
                <p className="text-[9px] text-muted-foreground">Lower = better quality, larger file. Minimum 16.</p>
              </div>

              {codec === "h264" && (
                <div className="space-y-1">
                  <Label className="text-xs">H.264 preset</Label>
                  <Select
                    value={x264Preset}
                    onValueChange={(v) => setX264Preset(v as X264Preset)}
                    disabled={isRendering}>
                    <SelectTrigger size="sm" className="w-full text-xs h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {X264_PRESETS.map((p) => (
                        <SelectItem key={p} value={p} className="text-xs">
                          {X264_PRESET_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">JPEG frame quality</Label>
                  <span className="font-mono text-[10px]">{jpegQuality}</span>
                </div>
                <input
                  type="range"
                  min={60}
                  max={100}
                  step={1}
                  value={jpegQuality}
                  disabled={isRendering}
                  onChange={(e) => setJpegQuality(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary"
                />
                <p className="text-[9px] text-muted-foreground">Intermediate frames before H.264 encode.</p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <ExportHistory items={historyItems} loading={historyLoading} />
      </div>

      <div className="px-3 py-3 border-t border-border/50 shrink-0 space-y-1.5">
        <Button className="w-full h-8 text-xs" onClick={handleExport} disabled={disabled}>
          {isRendering ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Rendering… {renderProgress}%
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export {fullFileName}
            </>
          )}
        </Button>
        {isEmpty && !isRendering && (
          <p className="text-[10px] text-muted-foreground text-center">Add clips to the timeline first</p>
        )}
      </div>
    </div>
  );
}
