"use client";

import { useAuth } from "~/hooks/auth";

export function UserName() {

  const auth = useAuth();

  return (
    <span>{auth.user.name}</span>
  );

}
