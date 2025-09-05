import { z } from "zod";

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable().optional(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

// Various possible Better Auth response envelopes
export const BetterAuthUserSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  image: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const BetterAuthEnvelopeSchema = z.object({
  user: BetterAuthUserSchema.optional(),
  data: z.object({ user: BetterAuthUserSchema.optional() }).optional(),
  session: z
    .object({
      user: BetterAuthUserSchema.optional(),
      userId: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
});

export function normalizeAuthUser(input: unknown): z.infer<typeof AuthUserSchema> | null {
  const env = BetterAuthEnvelopeSchema.safeParse(input);
  if (!env.success) return null;
  const raw = env.data.user || env.data.data?.user || env.data.session?.user;
  const id = raw?.id ?? raw?.userId ?? env.data.session?.userId;
  if (!id) return null;
  const normalized = {
    id: String(id),
    email: (raw?.email as string | undefined) ?? null,
    name: (raw?.name as string | undefined) ?? null,
    image: (raw?.image as string | undefined) ?? (raw?.avatarUrl as string | undefined) ?? null,
  };
  return AuthUserSchema.parse(normalized);
}

