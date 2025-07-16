"use client";

import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { stackApp } from "@/stack";

/**
 * Wrap pages/components with <RequireAuth> to protect them.
 * Redirects to /signin when no user is present.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const router = useRouter();
  const { useUser } = stackApp;
  const user = useUser();

  useEffect(() => {
    // When user is known to be unauthenticated, push to /signin.
    if (user === null) {
      router.push("/signin");
    }
  }, [user, router]);

  if (!user) {
    // Could return a spinner or skeleton here.
    return null;
  }

  return <>{children}</>;
} 