"use client";

import { useSnapshot } from "valtio";

import { authService } from "~/lib/auth";
import { userStore } from "~/stores/userStore";

export function useAuth() {
  const snap = useSnapshot(userStore);

  authService.ensureSignedIn();

  return { user: snap.user };
}
