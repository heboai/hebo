export const corsConfig =
  process.env.NODE_ENV === "production"
    ? {
        // Matches any HTTP or HTTPS origin that ends with "hebo.ai"
        origin: /^https?:\/\/([^/?#]*)\.?hebo\.ai/,
      }
    : {
        origin: true,
      };
