export const isStackAuthEnabled = !!import.meta.env.VITE_STACK_PROJECT_ID;
export const isDevLocal =
  !process.env?.TURBO_HASH &&
  !import.meta.env.VITE_API_URL &&
  !import.meta.env.VITE_GATEWAY_URL;
export const isDev = import.meta.env.MODE === "development" && !isDevLocal;
