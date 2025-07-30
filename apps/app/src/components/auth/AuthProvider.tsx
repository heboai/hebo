"use client";

import { StackProvider, StackTheme } from "@stackframe/react";

import { isStackAuthEnabled, stackApp } from "~/lib/auth";

export function AuthProvider({
  children,
  redirect = false,
}: Readonly<{ children?: React.ReactNode; redirect?: boolean }>) {
  if (isStackAuthEnabled) {
    stackApp.useUser(redirect ? { or: "redirect" } : undefined);

    return (
      <StackProvider app={stackApp}>
        <StackTheme>{children}</StackTheme>
      </StackProvider>
    );
  }

  // No auth configured, show dummy
  return <div>{children}</div>;
}
