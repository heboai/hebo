"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { stackApp } from "@/components";

/**
 * Use <RequireAuth /> at the beginning of a page to protect it.
 * Redirects to /signin when no user is present.
 * Must be wrapped by stackProvider.
 */
export function RequireAuth() {
  const router = useRouter();
  const { useUser } = stackApp;
  const user = useUser();

  useEffect(() => {
    // When user is known to be unauthenticated, push to /signin.
    if (user === null) {
      router.push("/signin");
    }
  }, [user, router]);

  // Return null since this is a self-closing component
  return null;
} 