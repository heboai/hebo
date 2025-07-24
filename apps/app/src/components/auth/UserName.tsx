"use client";

import { useUser } from "@stackframe/react";

import { isStackAuth } from "~/lib/utils";

export function UserName() {

  const user = isStackAuth? useUser({or: "redirect"}) : null;
  
  if (isStackAuth) {
    return (
      <span>{user?.displayName || 'Not Logged-In'}</span>
    );

  } else {
    {/* Dummy component */}
    return (
      /* TODO: Read from user store */
      <span>
        N/A
      </span>
    );
  }
}

