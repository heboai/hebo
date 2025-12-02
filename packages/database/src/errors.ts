const prismaErrorsHttpStatusMapping = {
  P2002: { status: 409, message: "Resource already exists" },
  P2025: { status: 404, message: "Resource not found" },
} as const;

export const getPrismaError = (error: unknown) =>
  error &&
  typeof error === "object" &&
  "code" in error &&
  typeof error.code === "string"
    ? prismaErrorsHttpStatusMapping[error.code]
    : undefined;
