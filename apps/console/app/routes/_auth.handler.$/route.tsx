import { lazy, useLayoutEffect, useState, Suspense } from "react";
import { useLocation, Navigate } from "react-router";

const StackHandler = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackHandler })),
);
const StackProvider = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackProvider })),
);
const StackTheme = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackTheme })),
);

import { getStackApp } from "~/lib/auth/stack-auth";
import { isStackAuthEnabled } from "~/lib/env";

export default function AuthHandler() {
  const location = useLocation();

  // Prevent rendering during redirect and static export
  const [isClient, setIsClient] = useState(false);
  useLayoutEffect(() => {
    if (globalThis.window !== undefined) {
      setIsClient(true);
    }
  }, []);
  if (!isClient) return <></>;

  if (isStackAuthEnabled && isClient) {
    const stackApp = getStackApp();
    return (
      <Suspense fallback={null}>
        <StackProvider app={stackApp}>
          <StackTheme>
            <StackHandler app={stackApp} location={location.pathname} fullPage />
          </StackTheme>
        </StackProvider>
      </Suspense>
    );
  }

  return <Navigate to="/" replace />;
}
