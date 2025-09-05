import { z } from "zod";

export const TransitionDragPayloadSchema = z.object({
  id: z.string(),
  type: z.literal("transition"),
  presentation: z.enum(["fade", "wipe", "clockWipe", "slide", "flip", "iris"]),
  timing: z.enum(["linear", "spring"]).default("linear"),
  durationInFrames: z.number().int().positive(),
  leftScrubberId: z.string().nullable(),
  rightScrubberId: z.string().nullable(),
});

