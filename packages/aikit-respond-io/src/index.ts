// Export low-level tools for users who need direct access
export * as webhook from "./webhook";
export * as client from "./client";

// Export the new high-level adapter framework
export { createAdapter } from "./adapter";
