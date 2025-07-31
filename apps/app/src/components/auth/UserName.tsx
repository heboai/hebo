"use client";

import { useAuth } from "~/hooks/auth";

export function UserName() {
  const { user } = useAuth();

  // FUTURE: implement loading state
  return <span>{user?.name}</span>;
}
