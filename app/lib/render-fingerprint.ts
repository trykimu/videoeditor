import { createHash } from "node:crypto";
import { capExportDimensions, type ExportResolutionPreset } from "~/lib/render-settings";

export interface ExportFingerprintInput {
  timelineData: unknown;
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  codec: string;
  crf: number;
  resolutionPreset: string;
  muted: boolean;
  jpegQuality?: number;
  x264Preset?: string;
}

const TIME_PRECISION = 4;

function roundNum(n: number, decimals = TIME_PRECISION): number {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Strip volatile UI-only fields and stabilize numbers before hashing. */
function stripVolatile(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripVolatile);
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (
      k === "is_dragging" ||
      k === "isDragging" ||
      k === "keyframeLanesExpanded" ||
      k === "mediaUrlLocal"
    ) {
      continue;
    }
    if (typeof v === "number") {
      const isTimeKey =
        k === "startTime" ||
        k === "endTime" ||
        k === "duration" ||
        k === "trimBefore" ||
        k === "trimAfter";
      out[k] = isTimeKey ? roundNum(v) : roundNum(v, 2);
      continue;
    }
    out[k] = stripVolatile(v);
  }
  return out;
}

function normalizeTimelineData(timelineData: unknown): unknown {
  if (!Array.isArray(timelineData)) return stripVolatile(timelineData);

  return timelineData.map((track) => {
    const t = track as Record<string, unknown>;
    const scrubbers = Array.isArray(t.scrubbers) ? [...t.scrubbers] : [];
    scrubbers.sort((a, b) =>
      String((a as { id?: string }).id ?? "").localeCompare(String((b as { id?: string }).id ?? "")),
    );

    let transitions = t.transitions;
    if (transitions && typeof transitions === "object" && !Array.isArray(transitions)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(transitions as Record<string, unknown>).sort()) {
        sorted[key] = (transitions as Record<string, unknown>)[key];
      }
      transitions = sorted;
    }

    return stripVolatile({
      ...t,
      scrubbers,
      transitions,
    });
  });
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value);
}

export function computeExportFingerprint(input: ExportFingerprintInput): string {
  const preset = (["1080p", "720p", "source", "4k"].includes(input.resolutionPreset)
    ? input.resolutionPreset
    : "1080p") as ExportResolutionPreset;

  const capped = capExportDimensions(
    input.compositionWidth || 1920,
    input.compositionHeight || 1080,
    preset,
  );

  const payload = {
    timeline: normalizeTimelineData(input.timelineData),
    durationInFrames: Math.round(input.durationInFrames),
    compositionWidth: capped.width,
    compositionHeight: capped.height,
    codec: input.codec,
    crf: Math.round(input.crf),
    resolutionPreset: preset,
    muted: input.muted,
    jpegQuality:
      typeof input.jpegQuality === "number" ? Math.round(input.jpegQuality) : null,
    x264Preset: input.x264Preset ?? null,
  };
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}
