"use client";

import { StackProvider, StackTheme } from "@stackframe/react";

import { isStackAuthEnabled, stackApp } from "~/lib/auth";

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (isStackAuthEnabled) {
    return (
      <StackProvider app={stackApp}>
        <StackTheme>{children}</StackTheme>
      </StackProvider>
    );
  }

  // No auth configured, show dummy
  return <div>{children}</div>;
}
