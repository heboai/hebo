"use client";

import { StackHandler } from "@stackframe/react";
import { stackApp, StackProvider } from "~/lib/auth";
import { usePathname } from "next/navigation";

export function HandlerClient() {
  const pathname = usePathname();

  return (
    <StackProvider app={stackApp}>
        <StackHandler app={stackApp} location={pathname} fullPage={true} />
    </StackProvider>
  );
} 