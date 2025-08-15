export const isStackAuthEnabled = !!import.meta.env
  .NEXT_PUBLIC_STACK_PROJECT_ID;
export const isDevLocal = !import.meta.env.NEXT_PUBLIC_API_URL;
export const isDev = import.meta.env.MODE === "development" && !isDevLocal;
