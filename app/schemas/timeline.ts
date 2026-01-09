import { z } from "zod";

export const TextPropertiesSchema = z.object({
  textContent: z.string(),
  fontSize: z.number(),
  fontFamily: z.string(),
  color: z.string(),
  textAlign: z.enum(["left", "center", "right"]),
  fontWeight: z.enum(["normal", "bold"]),
  template: z.enum(["normal", "glassy"]).nullable(),
});

export const TransitionSchema = z.object({
  id: z.string(),
  presentation: z.enum(["fade", "wipe", "clockWipe", "slide", "flip", "iris"]),
  timing: z.enum(["spring", "linear"]),
  durationInFrames: z.number().int().nonnegative(),
  leftScrubberId: z.string().nullable(),
  rightScrubberId: z.string().nullable(),
});

export const MediaBinBaseSchema = z.object({
  id: z.string(),
  mediaType: z.enum(["video", "image", "audio", "text", "groupped_scrubber"]),
  mediaUrlLocal: z.string().nullable(),
  mediaUrlRemote: z.string().nullable(),
  media_width: z.number(),
  media_height: z.number(),
  text: TextPropertiesSchema.nullable(),
  groupped_scrubbers: z.any().nullable(),
  left_transition_id: z.string().nullable(),
  right_transition_id: z.string().nullable(),
});

export const MediaBinItemSchema = MediaBinBaseSchema.extend({
  name: z.string(),
  durationInSeconds: z.number().nonnegative(),
  uploadProgress: z.number().nullable(),
  isUploading: z.boolean(),
});

export const ScrubberStateSchema = MediaBinItemSchema.extend({
  left: z.number().nonnegative(),
  y: z.number().int().nonnegative(),
  width: z.number().nonnegative(),
  sourceMediaBinId: z.string(),
  left_player: z.number(),
  top_player: z.number(),
  width_player: z.number(),
  height_player: z.number(),
  is_dragging: z.boolean(),
  trimBefore: z.number().int().nullable(),
  trimAfter: z.number().int().nullable(),
});

export const TrackStateSchema = z.object({
  id: z.string(),
  scrubbers: z.array(ScrubberStateSchema),
  transitions: z.array(TransitionSchema),
});

export const TimelineStateSchema = z.object({
  tracks: z.array(TrackStateSchema),
});

export type TimelineStateParsed = z.infer<typeof TimelineStateSchema>;
export type ScrubberStateParsed = z.infer<typeof ScrubberStateSchema>;

