import pino from "pino";

const LOG_LEVEL = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level: LOG_LEVEL,
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
    },
  }),
});
