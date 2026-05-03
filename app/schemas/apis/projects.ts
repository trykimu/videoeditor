import { z } from "zod";
import { MediaBinItemSchema, TimelineStateSchema } from "../timeline";

const dateLikeToString = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const DateString = z.union([z.string(), z.date()]).transform((v) => dateLikeToString(v));

const ProjectMetaSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  created_at: DateString,
  updated_at: DateString,
});

export const ProjectsResponseSchema = z.object({
  projects: z.array(ProjectMetaSchema),
});

// asyncpg may return the jsonb column as a JSON string in certain driver
// versions/configs. Preprocess to JSON.parse if needed so both code paths work.
const timelineField = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      try { return JSON.parse(val); } catch { return null; }
    }
    return val;
  },
  z.union([TimelineStateSchema, z.record(z.string(), z.unknown())]).nullable(),
);

export const ProjectStateResponseSchema = z.object({
  project: ProjectMetaSchema,
  timeline: timelineField,
  textBinItems: z.array(MediaBinItemSchema).default([]),
});

export const CreateProjectBodySchema = z.object({ name: z.string().min(1).max(120).default("Untitled Project") });

const opt = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? (undefined as z.infer<T> | undefined));

export const PatchProjectBodySchema = z.object({
  name: opt(z.string().min(1).max(120)),
  timeline: opt(TimelineStateSchema),
  textBinItems: opt(z.array(MediaBinItemSchema)),
});
