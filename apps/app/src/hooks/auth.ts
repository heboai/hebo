"use client";

import { useSnapshot } from "valtio";

import { authService } from "~/lib/auth";
import { userStore } from "~/stores/userStore";

export function useAuth(redirect?: boolean) {
  authService.ensureSignedIn(redirect);

  return useSnapshot(userStore);
}
