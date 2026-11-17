import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

// Errores del navegador. Sin DSN (desarrollo) Sentry queda apagado.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
}

// Métricas del piloto. Solo eventos explícitos: sin autocaptura ni grabación de sesiones,
// para no recoger lo que la gente escribe en los formularios.
if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    capture_pageview: "history_change",
    autocapture: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
