// PostHog configuration for client-side rendering
export const POSTHOG_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  apiHost: "/ingest", // Using the rewrite rule from next.config.ts
  uiHost: "https://eu.posthog.com",
  capturePageview: false, // We'll handle this manually
  capturePageleave: true,
  captureExceptions: true,
  debug: process.env.NODE_ENV === "development",
} as const;
