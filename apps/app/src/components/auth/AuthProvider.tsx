"use client";

import {
  AccountSettings,
  MagicLinkSignIn,
  OAuthButtonGroup,
  StackProvider,
  StackTheme,
} from "@stackframe/react";

import { isStackAuth, stackApp } from "~/lib/auth";

function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isStackAuth) {
    return (
      <StackProvider app={stackApp}>
        <StackTheme>{children}</StackTheme>
      </StackProvider>
    );
  }

  // No auth configured, show dummy
  return <div>{children}</div>;
}

export { AuthProvider, AccountSettings, MagicLinkSignIn, OAuthButtonGroup };
