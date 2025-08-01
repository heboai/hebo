"use client";

import { useAuth } from "~/hooks/auth";

export function UserName() {
  const { user } = useAuth();

  return <span>{user ? user.name : "Loading..."}</span>;
}
