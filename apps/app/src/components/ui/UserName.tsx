"use client";

import { useUser } from "@stackframe/react";

export function UserName() {
  const user = useUser({
    or: "redirect"
  });
  
  return (
    <span>{user?.displayName || 'User'}</span>
  );
} 
