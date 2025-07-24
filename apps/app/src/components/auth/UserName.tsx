"use client";

import { useSnapshot } from "valtio";
import { authState } from "~/stores/auth";

export function UserName() {

  const snap = useSnapshot(authState);

  return (
    <span>{snap.user.name}</span>
  );

}
