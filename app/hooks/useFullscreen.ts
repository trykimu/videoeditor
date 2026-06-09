import { useCallback, useEffect, useState, type RefObject } from "react";

/** Fullscreen the preview container (OpenCut-style), not only the video element. */
export function useFullscreen(containerRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [containerRef]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen();
  }, [containerRef]);

  return { isFullscreen, toggleFullscreen };
}
