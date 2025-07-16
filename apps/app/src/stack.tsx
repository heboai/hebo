"use client";

import { StackClientApp } from "@stackframe/stack";

/**
 * Global StackAuth instance for the browser.
 * Tokens are stored in memory so the build can be fully static –
 * no cookies or server helpers are required.
 */
export const stackApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
    tokenStore: "memory",
    urls: {
        signIn: "/signin",
        signUp: "/signin",
        accountSettings: "/settings",
        home: "/",
    },
    redirectMethod: "window",
});