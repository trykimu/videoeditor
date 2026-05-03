import { z } from "zod";

export const StorageResponseSchema = z.object({
  usedBytes: z.coerce.number().nonnegative().default(0),
  limitBytes: z.coerce
    .number()
    .positive()
    .default(2 * 1024 * 1024 * 1024),
});

export const BackendProjectsResponseSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      created_at: z.string().optional(),
    }),
  ),
});

export const GitHubRepoStatsSchema = z.object({
  stargazers_count: z.coerce.number().nonnegative(),
});
