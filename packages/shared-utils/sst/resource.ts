import { Resource } from "sst";

export const getSSTResource = <T>(
  name: string,
  key: string,
  fallback: T,
): T => {
  try {
    const resources = Resource as unknown as Record<
      string,
      Record<string, unknown>
    >;
    const value = resources[name]?.[key];
    return (value as T) ?? fallback;
  } catch {
    return fallback;
  }
};
