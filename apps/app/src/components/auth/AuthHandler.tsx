"use client";

import { usePathname } from "next/navigation";

import { lazy, useLayoutEffect, useState } from "react";

const StackHandler = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackHandler })),
);
const StackProvider = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackProvider })),
);
const StackTheme = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackTheme })),
);

import { isStackAuthEnabled } from "~/lib/env";
import { getStackApp } from "~/lib/auth/stackAuth";

export function AuthHandler() {
  const pathname = usePathname();

  // Prevent rendering during redirect and static export
  const [isClient, setIsClient] = useState(false);
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);
  if (!isClient) return null;

  if (isStackAuthEnabled && isClient) {
    const stackApp = getStackApp();
    return (
      <StackProvider app={stackApp}>
        <StackTheme>
          <StackHandler app={stackApp} location={pathname} fullPage />
        </StackTheme>
      </StackProvider>
    );
  }

  return <></>;
}
