import { type Config } from "tailwindcss"

export default {
  theme: {
    extend: {
      fontSize: {
        headline: "var(--text-headline)",
        xl:       "var(--text-xl)",
        "xl-sm":  "var(--text-xl-sm)",
        lg:       "var(--text-lg)",
        base:     "var(--text-base)",
        sm:       "var(--text-sm)",
      },
    },
  },
} satisfies Config
