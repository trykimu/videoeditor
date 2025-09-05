import { z } from "zod";

const dateLikeToString = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const DateString = z.union([z.string(), z.date()]).transform((v) => dateLikeToString(v));

export const ProjectsResponseSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      user_id: z.string(),
      name: z.string(),
      created_at: DateString,
      updated_at: DateString,
    }),
  ),
});

export const ProjectStateResponseSchema = z.object({
  project: z.object({
    id: z.string(),
    user_id: z.string(),
    name: z.string(),
    created_at: DateString,
    updated_at: DateString,
  }),
  timeline: z.unknown(),
  textBinItems: z.array(z.unknown()),
});

export const CreateProjectBodySchema = z.object({ name: z.string().min(1).max(120).default("Untitled Project") });

const opt = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? (undefined as z.infer<T> | undefined));
export const PatchProjectBodySchema = z.object({
  name: opt(z.string().min(1).max(120)),
  timeline: z
    .unknown()
    .nullish()
    .transform((v) => v ?? undefined),
  textBinItems: z
    .array(z.unknown())
    .nullish()
    .transform((v) => v ?? undefined),
});
