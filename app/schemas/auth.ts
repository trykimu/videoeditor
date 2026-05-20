import { z } from "zod";

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable().optional(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

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

export function getAuthCreatedAt(input: unknown): string | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const fromUser = obj.user as Record<string, unknown> | undefined;
  const fromDataUser =
    obj.data && typeof obj.data === "object"
      ? ((obj.data as Record<string, unknown>).user as Record<string, unknown> | undefined)
      : undefined;
  const created =
    fromUser?.createdAt ??
    fromUser?.created_at ??
    fromUser?.created_at_ms ??
    fromDataUser?.createdAt ??
    fromDataUser?.created_at ??
    fromDataUser?.created_at_ms;
  if (created == null) return null;
  if (typeof created === "number") return String(created);
  if (typeof created === "string") return created;
  if (created instanceof Date) return created.toISOString();
  return null;
}
