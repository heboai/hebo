export const isDev = process.env.NODE_ENV === "development";
export const isStackAuthEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

export function getCookie(name: string): string | undefined {
  if (typeof document !== "undefined") {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return value?.split("=")[1];
  }
}
