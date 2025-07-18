"use client";

import { useStackApp } from "@stackframe/react";
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';

export function UserDisplay() {
  const app = useStackApp();
  const user = app?.useUser();
  const posthog = usePostHog();
  
  useEffect(() => {
    if (user && posthog && typeof window !== "undefined") {
      posthog.identify(user.id, {
        name: user.displayName,
        email: user.primaryEmail
      });
    }
  }, [user, posthog]);
  
  return (
    <p className="text-secondary-foreground text-center text-xl-sm md:text-xl">
      Hi {user?.displayName || 'User'}! Evaluate your custom <br /> agent or existing (fine-tuned) LLM
    </p>
  );
} 