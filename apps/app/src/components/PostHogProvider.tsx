"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { POSTHOG_CONFIG } from "@/lib/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog on the client side
    if (typeof window !== "undefined") {
      posthog.init(POSTHOG_CONFIG.apiKey, {
        api_host: POSTHOG_CONFIG.apiHost,
        ui_host: POSTHOG_CONFIG.uiHost,
        capture_pageview: POSTHOG_CONFIG.capturePageview,
        capture_pageleave: POSTHOG_CONFIG.capturePageleave,
        capture_exceptions: POSTHOG_CONFIG.captureExceptions,
        debug: POSTHOG_CONFIG.debug,
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog && typeof window !== "undefined") {
      // Use window.location.origin if available, otherwise construct from pathname
      let url = typeof window !== "undefined" && window.origin 
        ? window.origin + pathname 
        : pathname;
      const search = searchParams.toString();
      if (search) {
        url += "?" + search;
      }
      posthog.capture("$pageview", { "$current_url": url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}