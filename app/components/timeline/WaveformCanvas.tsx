import React, { useRef, useEffect } from "react";

interface WaveformCanvasProps {
  peaks: Float32Array;
  width: number;
  height: number;
  /** CSS colour string for the bars */
  color?: string;
}

/**
 * Draws a symmetric RMS waveform onto a <canvas>.
 * Redraws only when peaks, width, height, or color change.
 */
export function WaveformCanvas({ peaks, width, height, color = "rgba(255,255,255,0.55)" }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0 || peaks.length === 0) return;

    // Use logical (CSS) pixels for size, physical pixels for drawing
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(width * dpr);
    const ph = Math.round(height * dpr);

    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, pw, ph);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = color;

    const midY = height / 2;
    // 1 px bar + 1 px gap = 2 px per bar
    const numBars = Math.floor(width / 2);

    for (let i = 0; i < numBars; i++) {
      // Map bar → peak sample
      const peakIdx = Math.floor((i / numBars) * peaks.length);
      const amp = peaks[peakIdx] ?? 0;

      // Reserve 2 px headroom (1 px each side)
      const halfBar = Math.max(0.5, amp * (midY - 1));

      ctx.fillRect(i * 2, midY - halfBar, 1, halfBar * 2);
    }

    ctx.restore();
  }, [peaks, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block" }}
      className="absolute inset-0 pointer-events-none rounded-sm"
    />
  );
}
