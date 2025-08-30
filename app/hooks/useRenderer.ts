import { useState, useCallback } from "react";
import axios from "axios";
import {
  type TimelineDataItem,
  type TimelineState,
  FPS,
} from "~/components/timeline/types";
import { apiUrl } from "~/utils/api";

export const useRenderer = () => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>("");

  const handleRenderVideo = useCallback(
    async (
      getTimelineData: () => TimelineDataItem[],
      timeline: TimelineState,
      compositionWidth: number | null,
      compositionHeight: number | null,
      getPixelsPerSecond: () => number
    ) => {
      setIsRendering(true);
      setRenderStatus("Starting render...");
      console.log("Render server base URL:", apiUrl("/render"));

      try {
        // Test server connection first
        setRenderStatus("Connecting to render server...");
        try {
          await axios.get(apiUrl("/health"), { timeout: 5000 });
        } catch (healthError) {
          throw new Error(
            "Cannot connect to render server. Make sure the server is running on http://localhost:8000"
          );
        }

        const timelineData = getTimelineData();
        // Calculate composition width if not provided
        if (compositionWidth === null) {
          let maxWidth = 0;
          for (const item of timelineData) {
            for (const scrubber of item.scrubbers) {
              if (
                scrubber.media_width !== null &&
                scrubber.media_width > maxWidth
              ) {
                maxWidth = scrubber.media_width;
              }
            }
          }
          compositionWidth = maxWidth || 1920; // Default to 1920 if no media found
        }

        // Calculate composition height if not provided
        if (compositionHeight === null) {
          let maxHeight = 0;
          for (const item of timelineData) {
            for (const scrubber of item.scrubbers) {
              if (
                scrubber.media_height !== null &&
                scrubber.media_height > maxHeight
              ) {
                maxHeight = scrubber.media_height;
              }
            }
          }
          compositionHeight = maxHeight || 1080; // Default to 1080 if no media found
        }

        console.log("Composition width:", compositionWidth);
        console.log("Composition height:", compositionHeight);

        if (
          timeline.tracks.length === 0 ||
          timeline.tracks.every((t) => t.scrubbers.length === 0)
        ) {
          setRenderStatus("Error: No timeline data to render");
          setIsRendering(false);
          return;
        }

        setRenderStatus("Rendering video...");

        const response = await axios.post(
          apiUrl("/render"),
          {
            timelineData: timelineData,
            compositionWidth: compositionWidth,
            compositionHeight: compositionHeight,
            durationInFrames: (() => {
              const timelineData = getTimelineData();
              let maxEndTime = 0;

              timelineData.forEach((timelineItem) => {
                timelineItem.scrubbers.forEach((scrubber) => {
                  if (scrubber.endTime > maxEndTime) {
                    maxEndTime = scrubber.endTime;
                  }
                });
              });
              console.log("Max end time:", maxEndTime * 30);
              return Math.ceil(maxEndTime * FPS);
            })(),
            getPixelsPerSecond: getPixelsPerSecond(),
          },
          {
            responseType: "blob",
            timeout: 900000,
            onDownloadProgress: (progressEvent) => {
              if (progressEvent.lengthComputable && progressEvent.total) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setRenderStatus(
                  `Downloading rendered video: ${percentCompleted}%`
                );
              }
            },
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "rendered-video.mp4");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setRenderStatus("Video rendered and downloaded successfully!");
      } catch (error) {
        console.error("Render error:", error);
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            setRenderStatus("Error: Render timeout - try a shorter video");
          } else if (error.response?.status === 500) {
            setRenderStatus(
              `Error: ${
                error.response.data?.message || "Server error during rendering"
              }`
            );
          } else if (error.request) {
            setRenderStatus(
              "Error: Cannot connect to render server. Make sure the backend is running on localhost:8000. Run: pnpm dlx tsx app/videorender/videorender.ts"
            );
          } else {
            setRenderStatus(`Error: ${error.message}`);
          }
        } else {
          setRenderStatus("Error: Unknown rendering error occurred");
        }
      } finally {
        setIsRendering(false);
        setTimeout(() => setRenderStatus(""), 8000); // Show error longer
      }
    },
    []
  );

  return {
    isRendering,
    renderStatus,
    handleRenderVideo,
  };
};
