export const isStackAuthEnabled = !!import.meta.env.VITE_STACK_PROJECT_ID;
export const isDevLocal = !import.meta.env.VITE_API_URL;
export const isDev = import.meta.env.MODE === "development" && !isDevLocal;
