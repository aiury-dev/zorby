import { z } from "zod";

export const serverEnvSchema = z.object({
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
});

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function parseServerEnv(input: NodeJS.ProcessEnv = process.env) {
  return serverEnvSchema.parse(input);
}

export function parsePublicEnv(input: NodeJS.ProcessEnv = process.env) {
  return publicEnvSchema.parse(input);
}
