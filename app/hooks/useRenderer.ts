import { useState, useCallback } from "react";
import axios from "axios";
import { type TimelineDataItem, type TimelineState, FPS } from "~/components/timeline/types";

export const useRenderer = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>("");

  const handleRenderVideo = useCallback(
    async (
      getTimelineData: () => TimelineDataItem[],
      timeline: TimelineState,
      compositionWidth: number | null,
      compositionHeight: number | null,
      getPixelsPerSecond: () => number,
    ) => {
      setIsRendering(true);
      setRenderStatus("Starting render...");

      try {
        setRenderStatus("Connecting to render server...");
        try {
          await axios.get("/renderer/health", { timeout: 5000 });
        } catch {
          throw new Error("Cannot connect to render server. Run: pnpm dlx tsx app/videorender/videorender.ts");
        }

        const timelineData = getTimelineData();

        if (compositionWidth === null) {
          compositionWidth = timelineData.flatMap((d) => d.scrubbers).reduce(
            (max, s) => (s.media_width && s.media_width > max ? s.media_width : max),
            0,
          ) || 1920;
        }

        if (compositionHeight === null) {
          compositionHeight = timelineData.flatMap((d) => d.scrubbers).reduce(
            (max, s) => (s.media_height && s.media_height > max ? s.media_height : max),
            0,
          ) || 1080;
        }

        if (timeline.tracks.length === 0 || timeline.tracks.every((t) => t.scrubbers.length === 0)) {
          setRenderStatus("Error: No timeline data to render");
          setIsRendering(false);
          return;
        }

        setRenderStatus("Rendering video...");

        const response = await axios.post(
          "/renderer/render",
          {
            timelineData: timelineData,
            compositionWidth: compositionWidth,
            compositionHeight: compositionHeight,
            durationInFrames: Math.ceil(
              timelineData.flatMap((d) => d.scrubbers).reduce((max, s) => (s.endTime > max ? s.endTime : max), 0) * FPS,
            ),
            getPixelsPerSecond: getPixelsPerSecond(),
          },
          { timeout: 900000 },
        );

        const { downloadUrl } = response.data as { downloadUrl: string };

        // Trigger download from R2 presigned URL — browser downloads directly from R2
        setRenderStatus("Downloading rendered video...");
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", "rendered-video.mp4");
        document.body.appendChild(link);
        link.click();
        link.remove();

        setRenderStatus("Video rendered and downloaded successfully!");
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            setRenderStatus("Error: Render timed out — try a shorter video");
          } else if (error.response?.status === 500) {
            setRenderStatus("Error: Server error during rendering. Check render server logs.");
          } else if (error.response?.status === 413) {
            setRenderStatus("Error: Timeline data too large to render");
          } else if (error.request) {
            setRenderStatus("Error: Cannot connect to render server. Run: pnpm dlx tsx app/videorender/videorender.ts");
          } else {
            setRenderStatus(`Error: ${error.message}`);
          }
        } else if (error instanceof Error) {
          setRenderStatus(`Error: ${error.message}`);
        } else {
          setRenderStatus("Error: Unknown rendering error occurred");
        }
      } finally {
        setIsRendering(false);
        setTimeout(() => setRenderStatus(""), 8000); // Show error longer
      }
    },
    [],
  );

  return {
    isRendering,
    renderStatus,
    handleRenderVideo,
  };
};
