import { z } from "zod";

export const IdParamSchema = z.string().min(1).max(128);

