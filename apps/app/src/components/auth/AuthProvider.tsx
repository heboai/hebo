"use client";

import dynamic from "next/dynamic";

import { isStackAuthEnabled } from "~/lib/utils";
import { getStackApp } from "~/lib/auth/stackAuth";

const StackProvider = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackProvider),
);
const StackTheme = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.StackTheme),
);

function useRedirectIfNotSignedIn(redirect: boolean) {
  const user = isStackAuthEnabled 
    ? getStackApp().useUser(redirect ? { or: "redirect" } : undefined)
    : undefined;
  return user;
}

export function AuthProvider({
  children,
  redirect = false,
}: Readonly<{ children?: React.ReactNode; redirect?: boolean }>) {
  useRedirectIfNotSignedIn(redirect);

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
