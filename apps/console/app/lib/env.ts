export const isStackAuthEnabled = !!import.meta.env.VITE_STACK_PROJECT_ID;
export const isDevLocal = !process.env?.TURBO_HASH;
export const isDev = import.meta.env.MODE === "development" && !isDevLocal;
