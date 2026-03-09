import { z } from "zod";

const numberish = z.union([z.number(), z.string()]).transform((v) => (typeof v === "number" ? v : parseFloat(v)));
const dateLikeToString = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
const DateString = z.union([z.string(), z.date()]).transform((v) => dateLikeToString(v));

export const AssetsResponseSchema = z.object({
  assets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mime_type: z.string(),
      size_bytes: numberish,
      width: z.number().nullable(),
      height: z.number().nullable(),
      duration_seconds: z.number().nullable(),
      durationInSeconds: z.number().nullable(),
      created_at: DateString,
      mediaUrlRemote: z.string(),
    }),
  ),
});

const opt = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? (undefined as z.infer<T> | undefined));
export const RegisterAssetBodySchema = z.object({
  filename: z.string(),
  originalName: z.string(),
  size: opt(z.number()),
  width: z.number().nullish(),
  height: z.number().nullish(),
  duration: z.number().nullish(),
});

export const CloneAssetBodySchema = z.object({ suffix: z.string().default("copy") });
