import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { type TimelineDataItem, type TimelineState, FPS } from "~/components/timeline/types";

export interface RenderOptions {
  codec?: "h264" | "h265" | "vp9";
  crf?: number;
}


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

      try {
        await axios.get("/renderer/health", { timeout: 5000 });
      } catch {
        toast.error("Cannot reach render server. Start it with: pnpm dlx tsx app/videorender/videorender.ts");
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
        toast.error(msg);
        setIsRendering(false);
        return;
      }

      const evtSource = new EventSource(`/renderer/render/${jobId}/events`);
      evtSourceRef.current = evtSource;

      // Track whether a terminal event was already received. When the server
      // closes the SSE connection after sending "completed", EventSource fires
      // onerror (it can't distinguish intentional close from a crash). We must
      // not show an error toast in that case.
      let receivedFinalEvent = false;

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
        } else if (event.type === "completed") {
          receivedFinalEvent = true;
          setRenderProgress(100);
          toast.success("Export complete — download starting");
          const link = document.createElement("a");
          link.href = event.downloadUrl;
          link.setAttribute("download", "rendered-video.mp4");
          document.body.appendChild(link);
          link.click();
          link.remove();
          finish();
        } else if (event.type === "failed" || event.type === "error") {
          receivedFinalEvent = true;
          toast.error(`Export failed: ${event.message}`);
          finish();
        }
      };

      evtSource.onerror = () => {
        if (!receivedFinalEvent) {
          toast.error("Lost connection to render server");
          finish();
        }
      };
    },
    [],
  );

  return { isRendering, renderProgress, handleRenderVideo };
};
