"use client";

import { useAuth } from "~/hooks/auth";

export function UserName() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <span>{user.name}</span>;
}
