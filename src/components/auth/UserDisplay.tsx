"use client";

import { useStackApp } from "@stackframe/stack";

export default function UserDisplay() {
  const app = useStackApp();
  const user = app.useUser();
  
  return (
    <p className="text-secondary-foreground text-center text-xl-sm md:text-xl">
      Hi {user?.displayName ?? 'User'}! Evaluate your custom <br /> agent or existing (fine-tuned) LLM
    </p>
  );
} 