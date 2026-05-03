import { useState, useCallback, useRef } from "react";
import axios from "axios";
import { type TimelineDataItem, type TimelineState, FPS } from "~/components/timeline/types";

export const useRenderer = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>("");
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const evtSourceRef = useRef<EventSource | null>(null);

  const handleRenderVideo = useCallback(
    async (
      getTimelineData: () => TimelineDataItem[],
      timeline: TimelineState,
      compositionWidth: number | null,
      compositionHeight: number | null,
      getPixelsPerSecond: () => number,
    ) => {
      // Cancel any existing render stream
      if (evtSourceRef.current) {
        evtSourceRef.current.close();
        evtSourceRef.current = null;
      }

      setIsRendering(true);
      setRenderProgress(0);
      setRenderStatus("Connecting to render server...");

      try {
        await axios.get("/renderer/health", { timeout: 5000 });
      } catch {
        setRenderStatus("Error: Cannot connect to render server. Run: pnpm dlx tsx app/videorender/videorender.ts");
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

      if (timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0)) {
        setRenderStatus("Error: No timeline data to render");
        setIsRendering(false);
        return;
      }

      setRenderStatus("Queuing render job...");

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
        });
        jobId = data.jobId;
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 500) {
            setRenderStatus("Error: Server error. Check render server logs.");
          } else if (err.request) {
            setRenderStatus("Error: Cannot connect to render server.");
          } else {
            setRenderStatus(`Error: ${err.message}`);
          }
        } else {
          setRenderStatus("Error: Failed to queue render job");
        }
        setIsRendering(false);
        return;
      }

      setRenderStatus("Render queued — waiting for worker...");

      const evtSource = new EventSource(`/renderer/render/${jobId}/events`);
      evtSourceRef.current = evtSource;

      const finish = (clearAfterMs?: number) => {
        evtSource.close();
        evtSourceRef.current = null;
        setIsRendering(false);
        if (clearAfterMs !== undefined) {
          setTimeout(() => {
            setRenderStatus("");
            setRenderProgress(0);
          }, clearAfterMs);
        }
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
          setRenderStatus(`Rendering... ${event.percent}%`);
        } else if (event.type === "completed") {
          setRenderProgress(100);
          setRenderStatus("Downloading...");
          const link = document.createElement("a");
          link.href = event.downloadUrl;
          link.setAttribute("download", "rendered-video.mp4");
          document.body.appendChild(link);
          link.click();
          link.remove();
          setRenderStatus("Render complete!");
          finish(8000);
        } else if (event.type === "failed" || event.type === "error") {
          setRenderStatus(`Error: ${event.message}`);
          finish(8000);
        }
      };

      evtSource.onerror = () => {
        setRenderStatus("Error: Lost connection to render server");
        finish(8000);
      };
    },
    [],
  );

  return {
    isRendering,
    renderStatus,
    renderProgress,
    handleRenderVideo,
  };
};
