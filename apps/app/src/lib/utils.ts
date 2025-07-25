export const isDev = process.env.NODE_ENV === "development";

export function getCookie(name: string): string | undefined {
  if (typeof document !== "undefined") {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return value?.split("=")[1];
  }
}
