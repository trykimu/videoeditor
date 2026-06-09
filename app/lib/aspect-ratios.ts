export const ASPECT_RATIO_PRESETS = [
  { id: "16:9", label: "16:9", width: 1920, height: 1080 },
  { id: "9:16", label: "9:16", width: 1080, height: 1920 },
  { id: "1:1", label: "1:1", width: 1080, height: 1080 },
  { id: "4:5", label: "4:5", width: 1080, height: 1350 },
  { id: "4:3", label: "4:3", width: 1440, height: 1080 },
  { id: "21:9", label: "21:9", width: 2560, height: 1080 },
] as const;

export type AspectRatioPresetId = (typeof ASPECT_RATIO_PRESETS)[number]["id"];

export function findAspectPreset(width: number, height: number): AspectRatioPresetId | "custom" {
  const match = ASPECT_RATIO_PRESETS.find((p) => p.width === width && p.height === height);
  return match?.id ?? "custom";
}
