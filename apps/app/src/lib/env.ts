export const isStackAuthEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
export const isDevLocal = process.env.NEXT_PUBLIC_API_URL!.includes("mock");
export const isDev = process.env.NODE_ENV === "development" && !isDevLocal;
