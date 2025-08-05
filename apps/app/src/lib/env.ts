// Environment variables and derived values
export const isStackAuthEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
export const isDevLocal = !process.env.NEXT_PUBLIC_API_URL;

// Stack Auth environment variables with runtime validation
export const STACK_PROJECT_ID = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
export const STACK_PUBLISHABLE_CLIENT_KEY = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;

// Validate Stack Auth environment variables when enabled
if (isStackAuthEnabled) {
  if (!STACK_PROJECT_ID) {
    throw new Error('NEXT_PUBLIC_STACK_PROJECT_ID is required when Stack Auth is enabled');
  }
  if (!STACK_PUBLISHABLE_CLIENT_KEY) {
    throw new Error('NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is required when Stack Auth is enabled');
  }
}

// API environment variables
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const PORT = process.env.PORT || '3001'; 