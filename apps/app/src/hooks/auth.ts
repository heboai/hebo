"use client";

import { useSnapshot } from "valtio";

import { authService } from "~/lib/auth";
import { userStore } from "~/stores/userStore";

export function useAuth() {
  authService.ensureSignedIn();

  const snap = useSnapshot(userStore);

  return { user: snap.user };
}
