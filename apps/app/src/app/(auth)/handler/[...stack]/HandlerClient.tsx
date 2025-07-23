"use client";

import { usePathname } from "next/navigation";

import { useEffect, useState } from "react";
import { StackHandler } from "@stackframe/react";

import { stackApp, StackProvider } from "~/lib/auth";


export function HandlerClient() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // During static generation, show loading
  if (!isClient) {
    return <></>;
  }

  return (
    <StackProvider app={stackApp}>
        <StackHandler app={stackApp} location={pathname} fullPage={true} />
    </StackProvider>
  );
} 