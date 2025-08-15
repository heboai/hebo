"use client";

import { useEffect } from "react";

export function MSWProvider() {
  // FUTURE refactor this into service instead of component
  useEffect(() => {
    // Only run MSW in browser and when no real API URL is set
    if (globalThis.window === undefined) return;

    // Avoid double-starts in React Strict Mode
    const w = globalThis.window as Window & { __mswStarted?: boolean };
    if (w.__mswStarted) return;
    w.__mswStarted = true;

    import("~/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .then((result) => {
        console.log("[MSW] Mock Service Worker started.");
        return result;
      })
      .catch((error) => {
        // Allow retry on next render pass if startup fails
        w.__mswStarted = false;
        console.error("[MSW] Failed to start worker:", error);
      });
  }, []);

  return <></>;
}
