"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";

const StackHandler = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackHandler),
);
const StackProvider = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackProvider),
);
const StackTheme = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackTheme),
);

import { isStackAuthEnabled } from "~/lib/utils";
import { getStackApp } from "~/lib/auth/stackAuth";

export function AuthHandler() {
  const pathname = usePathname();

  // Prevent rendering during redirect and static export
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  if (isStackAuthEnabled && isClient) {
    const stackApp = getStackApp();
    return (
      <StackProvider app={stackApp}>
        <StackTheme>
          <StackHandler app={stackApp} location={pathname} fullPage />
        </StackTheme>
      </StackProvider>
    )
  }

  return null;
}
