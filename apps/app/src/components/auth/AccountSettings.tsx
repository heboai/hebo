"use client";

import { lazy } from "react";

import { isStackAuthEnabled } from "~/lib/env";

const StackAccountSettings = lazy(() =>
  import("@stackframe/react").then((mod) => ({ default: mod.AccountSettings })),
);

export function AccountSettings() {
  return isStackAuthEnabled ? (
    <StackAccountSettings />
  ) : (
    <>
      <h1>Account Settings</h1>
      <div>Not implemented for Dummy Auth</div>
    </>
  );
}
