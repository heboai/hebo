"use client"

import { AccountSettings, MagicLinkSignIn, OAuthButtonGroup, StackProvider, StackTheme } from "@stackframe/react";

import { stackApp } from "~/lib/auth";
import { isStackAuth } from "~/lib/utils";

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    if (isStackAuth) {
      return (
        <StackProvider app={stackApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      );

    } else {
      {/* Dummy component */}
      return (
        <div>{children}</div>
      );
    }

}

export { AccountSettings, MagicLinkSignIn, OAuthButtonGroup };
