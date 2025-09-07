export {
  AiResponseSchema,
  MoveScrubberArgsSchema,
  ResizeScrubberArgsSchema,
  AddScrubberByNameArgsSchema,
  AddMediaByIdArgsSchema,
  DeleteScrubbersInTrackArgsSchema,
  UpdateTextContentArgsSchema,
  UpdateTextStyleArgsSchema,
  MoveScrubbersByOffsetArgsSchema,
} from "../llm";

import { z } from "zod";

export const ChatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  isUser: z.boolean(),
  timestamp: z.union([z.date(), z.string()]).transform((v) => (typeof v === "string" ? new Date(v) : v)),
});

export const ChatTabSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(ChatMessageSchema),
  timelineSnapshot: z.unknown().nullable(),
  createdAt: z.number(),
});

export const ChatTabsStorageSchema = z.array(ChatTabSchema);
