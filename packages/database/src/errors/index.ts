import { Prisma } from "../generated/prisma/client";

export class ConflictError extends Error {
  constructor(message = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message = "Database error", cause?: unknown) {
    super(message);
    this.name = "DatabaseError";
    if (cause) {
      this.cause = cause;
    }
  }
}

export const handlePrismaError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ConflictError();
    }
    if (error.code === "P2025") {
      throw new NotFoundError();
    }
  }
  if (error instanceof NotFoundError) {
    throw error;
  }
  console.error(error);
  throw new DatabaseError(undefined, error);
};

export const resolveOrThrow = async <T>(
  promise: Promise<T | null | undefined>,
): Promise<T> => {
  try {
    const result = await promise;
    if (!result) {
      throw new NotFoundError();
    }
    return result;
  } catch (error) {
    return handlePrismaError(error);
  }
};
