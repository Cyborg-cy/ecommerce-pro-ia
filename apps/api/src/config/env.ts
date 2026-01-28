import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().default("0.0.0.0"),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ACCESS_TTL_MIN: z.coerce.number().int().min(1).max(60).default(15),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),

  DATABASE_URL: z.string().min(1),

  OPENAI_API_KEY: z.string().min(1).optional(),

  JWT_ISSUER: z.string().min(1).default("ecommerce-pro-ia"),
  REFRESH_COOKIE_NAME: z.string().min(1).default("refresh_token"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const fieldErrors = Object.entries(flattened.fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("\n");
    throw new Error(`Config inválida (.env)\n${fieldErrors}`);
  }
  return parsed.data;
}
