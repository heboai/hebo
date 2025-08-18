import type { Config } from "@react-router/dev/config";

export default {
  // Using middleware for auth
  future: {
    unstable_middleware: true,
  },
  // SSR is disabled to run the console as a SPA
  ssr: false,
} satisfies Config;
