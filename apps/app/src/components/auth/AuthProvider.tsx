"use client";

import { lazy, useLayoutEffect, useState } from "react";

import { isStackAuthEnabled } from "~/lib/utils";
import { getStackApp } from "~/lib/auth/stackAuth";

const StackProvider = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackProvider })),
);

const StackTheme = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackTheme })),
);

export function AuthProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>) {
  // Prevent rendering during static export
  const [isClient, setIsClient] = useState(false);
  useLayoutEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);
  if (!isClient) return null;

  if (isStackAuthEnabled) {
    const stackApp = getStackApp();
    return (
      <StackProvider app={stackApp}>
        <StackTheme>{children}</StackTheme>
      </StackProvider>
    );
  }

  return <>{children}</>;
}
