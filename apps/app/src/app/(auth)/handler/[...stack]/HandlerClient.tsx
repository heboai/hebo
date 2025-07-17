"use client";

import { StackHandler } from "@stackframe/react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";
import { stackApp } from "@/stack";

export function HandlerClient() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // During static generation, show loading
  if (!isClient) {
    return <Loading size="md" variant="primary" />;
  }
  
  return (
    <Suspense fallback={<Loading size="md" variant="primary" />}>
      <StackHandler app={stackApp} location={pathname} fullPage />
    </Suspense>
  );
} 