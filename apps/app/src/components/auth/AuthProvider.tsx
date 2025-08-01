"use client";

import dynamic from "next/dynamic";

import { isStackAuthEnabled } from "~/lib/utils";
import { getStackApp } from "~/lib/auth/stackAuth";
import { useEffect, useState } from "react";

const StackProvider = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackProvider),
);
const StackTheme = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackTheme),
);

export function AuthProvider({
  children,
}: Readonly<{ children?: React.ReactNode; redirect?: boolean }>) {

  // Prevent rendering during static export
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
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
