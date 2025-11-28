import { lazy, useState, Suspense } from "react";
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

import { getStackApp } from "~console/lib/auth/stack-auth";
import { isStackAuthEnabled } from "~console/lib/env";

export default function AuthHandler() {
  const location = useLocation();

  // Prevent rendering during redirect & static export
  const [isClient] = useState(() => globalThis.window !== undefined);
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
