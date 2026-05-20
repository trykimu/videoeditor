import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { type TimelineDataItem, type TimelineState, FPS } from "~/components/timeline/types";
import {
  capExportDimensions,
  clampExportCrf,
  sanitizeExportFileName,
  type ExportResolutionPreset,
  type X264Preset,
} from "~/lib/render-settings";

export interface RenderOptions {
  projectId: string;
  codec?: "h264" | "h265" | "vp9";
  crf?: number;
  resolutionPreset?: ExportResolutionPreset;
  outputFileName?: string;
  advancedMode?: boolean;
  jpegQuality?: number;
  x264Preset?: X264Preset;
  muted?: boolean;
  onComplete?: () => void;
}

type RenderStartResponse =
  | {
      cached: true;
      downloadUrl: string;
      previewUrl?: string;
      fileName: string;
      renderId: string;
    }
  | { cached: false; jobId: string };

export const useRenderer = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const evtSourceRef = useRef<EventSource | null>(null);

  const handleRenderVideo = useCallback(
    async (
      getTimelineData: () => TimelineDataItem[],
      timeline: TimelineState,
      compositionWidth: number | null,
      compositionHeight: number | null,
      getPixelsPerSecond: () => number,
      options: RenderOptions,
    ) => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }

      if (!options.projectId) {
        toast.error("Missing project — cannot export");
        return;
      }

      if (timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0)) {
        toast.error("Nothing to render — add clips to the timeline first");
        return;
      }

      setIsRendering(true);
      setRenderProgress(0);

      const finish = (onComplete?: () => void) => {
        setIsRendering(false);
        onComplete?.();
      };

      const triggerDownload = (downloadUrl: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      };

      try {
        await axios.get("/renderer/health", { timeout: 5000 });
      } catch {
        toast.error("Cannot reach render server. Start it with: pnpm dlx tsx app/videorender/videorender.ts");
        finish(options.onComplete);
        return;
      }

      const timelineData = getTimelineData();
      const resolutionPreset = options.resolutionPreset ?? "1080p";
      const codec = options.codec ?? "h264";
      const ext = codec === "vp9" ? ".webm" : ".mp4";
      const advancedMode = options.advancedMode ?? false;
      const crf = clampExportCrf(options.crf ?? 28, advancedMode);
      const outputFileName = sanitizeExportFileName(options?.outputFileName ?? "export", ext);

      if (compositionWidth === null) {
        compositionWidth =
          timelineData
            .flatMap((d) => d.scrubbers)
            .reduce((max, s) => (s.media_width && s.media_width > max ? s.media_width : max), 0) || 1920;
      }
      if (compositionHeight === null) {
        compositionHeight =
          timelineData
            .flatMap((d) => d.scrubbers)
            .reduce((max, s) => (s.media_height && s.media_height > max ? s.media_height : max), 0) || 1080;
      }

      const capped = capExportDimensions(compositionWidth, compositionHeight, resolutionPreset);

      let start: RenderStartResponse;
      try {
        const maxEndSeconds = timelineData
          .flatMap((d) => d.scrubbers)
          .reduce((max, s) => (s.endTime > max ? s.endTime : max), 0);
        const durationInFrames = Math.max(1, Math.round(maxEndSeconds * FPS));

        const { data } = await axios.post<RenderStartResponse>(
          "/renderer/render",
          {
            projectId: options.projectId,
            timelineData,
            compositionWidth: capped.width,
            compositionHeight: capped.height,
            durationInFrames,
            getPixelsPerSecond: getPixelsPerSecond(),
            codec,
            crf,
            resolutionPreset,
            outputFileName,
            advancedMode,
            jpegQuality: options.jpegQuality,
            x264Preset: options.x264Preset,
            muted: options.muted ?? false,
          },
          { withCredentials: true },
        );
        start = data;
      } catch (err) {
        const msg = axios.isAxiosError(err) && err.response?.status === 500
          ? "Server error — check render server logs"
          : "Failed to queue render job";
        toast.error(msg);
        finish(options.onComplete);
        return;
      }

      if (start.cached) {
        setRenderProgress(100);
        toast.success("Reusing previous export — no changes detected");
        triggerDownload(start.downloadUrl, start.fileName);
        finish(options.onComplete);
        return;
      }

      const jobId = start.jobId;
      const evtSource = new EventSource(`/renderer/render/${jobId}/events`);
      evtSourceRef.current = evtSource;

      let receivedFinalEvent = false;

      const closeStream = () => {
        evtSource.close();
        evtSourceRef.current = null;
      };

      evtSource.onmessage = (e: MessageEvent<string>) => {
        type RenderEvent =
          | { type: "progress"; percent: number }
          | { type: "completed"; downloadUrl: string; fileName?: string }
          | { type: "failed"; message: string }
          | { type: "error"; message: string };

        let event: RenderEvent;
        try {
          event = JSON.parse(e.data) as RenderEvent;
        } catch {
          return;
        }

        if (event.type === "progress") {
          setRenderProgress(event.percent);
        } else if (event.type === "completed") {
          receivedFinalEvent = true;
          setRenderProgress(100);
          toast.success("Export complete — download starting");
          triggerDownload(event.downloadUrl, event.fileName ?? outputFileName);
          closeStream();
          finish(options.onComplete);
        } else if (event.type === "failed" || event.type === "error") {
          receivedFinalEvent = true;
          toast.error(`Export failed: ${event.message}`);
          closeStream();
          finish(options.onComplete);
        }
      };

      evtSource.onerror = () => {
        if (!receivedFinalEvent) {
          toast.error("Lost connection to render server");
          closeStream();
          finish(options.onComplete);
        }
      };
    },
    [],
  );

  return { isRendering, renderProgress, handleRenderVideo };
};
