import { z } from "zod";

// Variables públicas: se leen una por una para que Next.js las incruste en el cliente.
const publicEnv = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
    NEXT_PUBLIC_AUTH_GOOGLE: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
    NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  })
  .parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_AUTH_GOOGLE: process.env.NEXT_PUBLIC_AUTH_GOOGLE || undefined,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || undefined,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || undefined,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  });

export const env = {
  supabaseUrl: publicEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  turnstileSiteKey: publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  googleEnabled: publicEnv.NEXT_PUBLIC_AUTH_GOOGLE === "true",
  posthogKey: publicEnv.NEXT_PUBLIC_POSTHOG_KEY,
  posthogHost: publicEnv.NEXT_PUBLIC_POSTHOG_HOST,
  // Sentry envía los errores al host del DSN; la CSP necesita permitirlo.
  sentryHost: publicEnv.NEXT_PUBLIC_SENTRY_DSN ? new URL(publicEnv.NEXT_PUBLIC_SENTRY_DSN).host : undefined,
};
