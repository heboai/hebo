"use client";

import { useSnapshot } from "valtio";

import { isStackAuth, stackApp } from "~/lib/auth";
import { authState } from "~/stores/auth";

export function useAuth(redirect?: boolean) {
  isStackAuth ?? stackApp.useUser(redirect ? { or: "redirect" } : undefined);

  return useSnapshot(authState);
}
