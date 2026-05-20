/**
 * Remotion render tuning — see:
 * https://www.remotion.dev/docs/troubleshooting/sigkill
 * https://www.remotion.dev/docs/renderer/render-media
 * https://www.remotion.dev/docs/encoding
 */

export type ExportResolutionPreset = "1080p" | "720p" | "source" | "4k";

const PRESET_MAX: Record<ExportResolutionPreset, { w: number; h: number }> = {
  "720p": { w: 1280, h: 720 },
  "1080p": { w: 1920, h: 1080 },
  source: { w: 1920, h: 1080 },
  "4k": { w: 3840, h: 2160 },
};

export function capExportDimensions(
  width: number,
  height: number,
  preset: ExportResolutionPreset = "1080p",
): { width: number; height: number; scaled: boolean; preset: ExportResolutionPreset } {
  const safeW = !width || width <= 0 ? 1920 : width;
  const safeH = !height || height <= 0 ? 1080 : height;
  const max = PRESET_MAX[preset];
  if (safeW <= max.w && safeH <= max.h) {
    return {
      width: even(safeW),
      height: even(safeH),
      scaled: false,
      preset,
    };
  }
  const scale = Math.min(max.w / safeW, max.h / safeH);
  return {
    width: even(Math.round(safeW * scale)),
    height: even(Math.round(safeH * scale)),
    scaled: true,
    preset,
  };
}

function even(n: number): number {
  return n % 2 === 0 ? n : n - 1;
}

export interface RemotionRenderTuning {
  concurrency: number;
  disallowParallelEncoding: boolean;
  offthreadVideoCacheSizeInBytes: number;
  jpegQuality: number;
  x264Preset: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium";
}

/** Memory-safe defaults for Docker / constrained hosts. */
export function getRemotionRenderTuning(width: number, height: number): RemotionRenderTuning {
  const pixels = width * height;
  const is4K = pixels > 1920 * 1080;

  if (is4K) {
    return {
      concurrency: 1,
      disallowParallelEncoding: true,
      offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024,
      jpegQuality: 85,
      x264Preset: "veryfast",
    };
  }

  if (pixels > 1280 * 720) {
    return {
      concurrency: 1,
      disallowParallelEncoding: true,
      offthreadVideoCacheSizeInBytes: 384 * 1024 * 1024,
      jpegQuality: 80,
      x264Preset: "veryfast",
    };
  }

  return {
    concurrency: 2,
    disallowParallelEncoding: false,
    offthreadVideoCacheSizeInBytes: 512 * 1024 * 1024,
    jpegQuality: 80,
    x264Preset: "fast",
  };
}

export function formatResolutionLabel(w: number, h: number): string {
  return `${w} × ${h}`;
}

export const X264_PRESETS = [
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
] as const;

export type X264Preset = (typeof X264_PRESETS)[number];

export function clampExportCrf(crf: number, advanced = false): number {
  const n = Math.round(crf);
  if (advanced) return Math.min(51, Math.max(16, n));
  return Math.min(51, Math.max(18, n));
}

export function sanitizeExportFileName(name: string, ext: string): string {
  const dotExt = ext.startsWith(".") ? ext : `.${ext}`;
  let base = name.trim().replace(/\.(mp4|webm|mov|mkv)$/i, "");
  base = base.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) base = "export";
  return `${base.slice(0, 120)}${dotExt}`;
}

export function defaultExportFileName(projectName: string, ext: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = projectName.trim() || "export";
  return sanitizeExportFileName(`${slug}-${date}`, ext);
}

/** BullMQ may deliver returnvalue as object or JSON string — handle both. */
export function parseRenderJobReturn(returnvalue: unknown): {
  downloadUrl: string;
  fileName?: string;
} | null {
  if (returnvalue == null) return null;

  let value: unknown = returnvalue;
  if (typeof returnvalue === "string") {
    const trimmed = returnvalue.trim();
    if (trimmed.startsWith("http")) {
      return { downloadUrl: trimmed };
    }
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return null;
    }
  }

  if (typeof value === "object" && value !== null && "downloadUrl" in value) {
    const downloadUrl = (value as { downloadUrl: unknown }).downloadUrl;
    const fileName = (value as { fileName?: unknown }).fileName;
    if (typeof downloadUrl === "string" && downloadUrl.length > 0) {
      return {
        downloadUrl,
        fileName: typeof fileName === "string" ? fileName : undefined,
      };
    }
  }

  return null;
}
