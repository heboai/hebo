"use client";

import dynamic from "next/dynamic";

import { isStackAuthEnabled } from "~/lib/utils";

const StackAccountSettings = dynamic(() =>
  import("@stackframe/react").then((mod) => mod.AccountSettings),
);

export function AccountSettings() {
  return isStackAuthEnabled ? (
    <StackAccountSettings />
  ) : (
    <>Not implemented for Dummy Auth</>
  );
}
