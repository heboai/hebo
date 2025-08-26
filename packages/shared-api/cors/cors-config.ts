export const corsConfig =
  process.env.NODE_ENV === "production"
    ? {
        // Matches HTTPS origins for exact "hebo.ai" or subdomains (e.g., "app.hebo.ai"),
        // requires a dot for subdomains and anchors to end of string
        origin: /^https:\/\/(?:hebo\.ai|(?:[a-z0-9-]+\.)+hebo\.ai)$/i,
      }
    : {
        origin: true,
      };
