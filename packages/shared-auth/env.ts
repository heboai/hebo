export const projectId = process.env.VITE_STACK_PROJECT_ID ?? "";
export const secretServerKey = process.env.STACK_SECRET_SERVER_KEY ?? "";

// Enabled when projectId has a non-empty value
export const isStackAuthEnabled = projectId.trim().length > 0;
