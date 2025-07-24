"use client";

import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { StackHandler, StackProvider } from "@stackframe/react";

import { stackApp } from "~/lib/auth";

export function AuthHandler() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // During static generation, show dummy
  if (!isClient) {
    return <></>;
  }

  return (
    <StackProvider app={stackApp}>
        <StackHandler app={stackApp} location={pathname} fullPage={true} />
        {/* ToDo: Set global user store */}
    </StackProvider>
  );
} 
