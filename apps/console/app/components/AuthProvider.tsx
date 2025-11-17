import { lazy, useState } from "react";

import { getStackApp } from "~console/lib/auth/stack-auth";
import { isStackAuthEnabled } from "~console/lib/env";

const StackProvider = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackProvider })),
);

const StackTheme = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.StackTheme })),
);

export function AuthProvider({
  children,
}: Readonly<{ children?: React.ReactNode }>) {
  // Prevent rendering during redirect & static export
  const [isClient] = useState(() => globalThis.window !== undefined);
  if (!isClient) return <></>;

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
