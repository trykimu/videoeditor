import { z } from "zod";

// Coercion helpers
export const numberish = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === "number") return v;
  const n = parseFloat(v as string);
  if (!Number.isFinite(n)) throw new Error("Invalid number");
  return n;
});

export const seconds = numberish.refine((n) => Number.isFinite(n) && n >= 0, "Invalid seconds");

// Nullish handling helpers (guideline: prefer nullish -> undefined transforms)
const opt = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => (v ?? undefined) as z.infer<T> | undefined);
export const optNumberish = opt(numberish);
export const optSeconds = opt(seconds);
export const optString = opt(z.string());

export const FunctionCallSchema = z.object({
  function_name: z.string(),
  arguments: z.record(z.unknown()).default({}),
});

export const AiResponseSchema = z.object({
  function_call: FunctionCallSchema.optional(),
  assistant_message: z.string().optional(),
});

// Per-function argument schemas (extend over time)
export const MoveScrubberArgsSchema = z.object({
  scrubber_id: z.string(),
  new_position_seconds: optSeconds,
  position_seconds: optSeconds,
  start_seconds: optSeconds,
  new_track_number: optNumberish,
  track_number: optNumberish,
  pixels_per_second: optNumberish,
});

export const ResizeScrubberArgsSchema = z.object({
  scrubber_id: optString,
  new_duration_seconds: optSeconds,
  duration_seconds: optSeconds,
  seconds: optSeconds,
  duration: optSeconds,
  newDurationSeconds: optSeconds,
  durationInSeconds: optSeconds,
  start_seconds: optSeconds,
  position_seconds: optSeconds,
  end_seconds: optSeconds,
  track_number: optNumberish,
  new_track_number: optNumberish,
  pixels_per_second: optNumberish,
  scrubber_name: optString,
  new_text_content: optString,
});

export const AddScrubberByNameArgsSchema = z.object({
  scrubber_name: z.string(),
  pixels_per_second: optNumberish,
  start_seconds: optSeconds,
  position_seconds: optSeconds,
  track_number: optNumberish,
  end_seconds: optSeconds,
  duration_seconds: optSeconds,
});

export const AddMediaByIdArgsSchema = z.object({
  scrubber_id: z.string(),
  pixels_per_second: optNumberish,
  start_seconds: optSeconds,
  track_number: optNumberish,
  end_seconds: optSeconds,
  duration_seconds: optSeconds,
});

export const DeleteScrubbersInTrackArgsSchema = z.object({
  track_number: optNumberish,
});

export const UpdateTextContentArgsSchema = z.object({
  scrubber_id: z.string(),
  new_text_content: z.string(),
});

export const UpdateTextStyleArgsSchema = z.object({
  scrubber_id: z.string(),
  fontSize: optNumberish,
  fontFamily: optString,
  color: optString,
  textAlign: z
    .enum(["left", "center", "right"])
    .nullish()
    .transform((v) => v ?? undefined),
  fontWeight: z
    .enum(["normal", "bold"])
    .nullish()
    .transform((v) => v ?? undefined),
});

export const MoveScrubbersByOffsetArgsSchema = z.object({
  scrubber_ids: z.array(z.string()),
  offset_seconds: seconds,
  pixels_per_second: optNumberish,
});
