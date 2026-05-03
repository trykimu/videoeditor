import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { type TimelineDataItem, type TimelineState, FPS } from "~/components/timeline/types";

export interface RenderOptions {
  codec?: "h264" | "h265" | "vp9";
  crf?: number;
}

const RENDER_TOAST_ID = "kimu-render";

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
      options?: RenderOptions,
    ) => {
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }

      if (timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0)) {
        toast.error("Nothing to render — add clips to the timeline first");
        return;
      }

      setIsRendering(true);
      setRenderProgress(0);
      toast.loading("Connecting to render server…", { id: RENDER_TOAST_ID });

      try {
        await axios.get("/renderer/health", { timeout: 5000 });
      } catch {
        toast.error("Cannot reach render server. Start it with: pnpm dlx tsx app/videorender/videorender.ts", {
          id: RENDER_TOAST_ID,
        });
        setIsRendering(false);
        return;
      }

      const timelineData = getTimelineData();

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

      toast.loading("Queuing render job…", { id: RENDER_TOAST_ID });

      let jobId: string;
      try {
        const { data } = await axios.post<{ jobId: string }>("/renderer/render", {
          timelineData,
          compositionWidth,
          compositionHeight,
          durationInFrames: Math.ceil(
            timelineData.flatMap((d) => d.scrubbers).reduce((max, s) => (s.endTime > max ? s.endTime : max), 0) * FPS,
          ),
          getPixelsPerSecond: getPixelsPerSecond(),
          codec: options?.codec ?? "h264",
          crf: options?.crf ?? 28,
        });
        jobId = data.jobId;
      } catch (err) {
        const msg = axios.isAxiosError(err) && err.response?.status === 500
          ? "Server error — check render server logs"
          : "Failed to queue render job";
        toast.error(msg, { id: RENDER_TOAST_ID });
        setIsRendering(false);
        return;
      }

      toast.loading("Render queued — waiting for worker…", { id: RENDER_TOAST_ID, description: "0%" });

      const evtSource = new EventSource(`/renderer/render/${jobId}/events`);
      evtSourceRef.current = evtSource;

      const finish = () => {
        evtSource.close();
        evtSourceRef.current = null;
        setIsRendering(false);
      };

      evtSource.onmessage = (e: MessageEvent<string>) => {
        type RenderEvent =
          | { type: "progress"; percent: number }
          | { type: "completed"; downloadUrl: string }
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
          toast.loading("Rendering…", { id: RENDER_TOAST_ID, description: `${event.percent}%` });
        } else if (event.type === "completed") {
          setRenderProgress(100);
          toast.success("Render complete — download starting", { id: RENDER_TOAST_ID });
          const link = document.createElement("a");
          link.href = event.downloadUrl;
          link.setAttribute("download", "rendered-video.mp4");
          document.body.appendChild(link);
          link.click();
          link.remove();
          finish();
        } else if (event.type === "failed" || event.type === "error") {
          toast.error(`Render failed: ${event.message}`, { id: RENDER_TOAST_ID });
          finish();
        }
      };

      evtSource.onerror = () => {
        toast.error("Lost connection to render server", { id: RENDER_TOAST_ID });
        finish();
      };
    },
    [],
  );

  return { isRendering, renderProgress, handleRenderVideo };
};
