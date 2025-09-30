export class NotFoundError extends Error {}

export const unwrap = async <T>(
  promise: Promise<T | null | undefined>,
): Promise<T> => {
  const result = await promise;
  if (!result) {
    throw new NotFoundError();
  }
  return result;
};
