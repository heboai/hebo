import { createRequire } from "node:module";

const requireModule = createRequire(import.meta.url);

// `sst` might not be installed or the code might be running outside the
// SST multiplexer.  So we attempt to synchronously require it and gracefully
// handle any failures.
export let ResourceSafe: any | undefined;
try {
  ResourceSafe = requireModule("sst").Resource;
} catch {
  // Module not found or other error – treat as non-SST environment.
  ResourceSafe = undefined;
}

// Helper to safely access a nested property on the Resource proxy.  If the
// proxy throws (because the SST resource map hasn't been initialised) we catch
// the error and return undefined instead – ensuring local development doesn't
// explode.
export const safeRead = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};
