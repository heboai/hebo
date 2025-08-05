// Environment variables and derived values
export const isStackAuthEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
export const isDevLocal = !process.env.NEXT_PUBLIC_API_URL;

// Stack Auth environment variables
export const STACK_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID!;
export const STACK_PUBLISHABLE_CLIENT_KEY = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!;

// API environment variables
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const PORT = process.env.PORT || '3001'; 