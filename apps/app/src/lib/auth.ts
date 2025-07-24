"use client"

import { useRouter } from "next/navigation";

import { StackClientApp } from "@stackframe/react";

import { authState } from "~/stores/auth";

export const isStackAuth = process.env.NEXT_PUBLIC_STACK_PROJECT_ID

let stackApp: StackClientApp<true, string>;

if (isStackAuth) {
  stackApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
    tokenStore: "cookie", // Client-side cookies
    urls: {
        signIn: "/signin",
        signUp: "/signin",
        accountSettings: "/settings",
        home: "/",
    },
    redirectMethod: {
        // Custom useNavigate function for Next.js App Router
        useNavigate: () => { return useRouter().push; },
    },
  });

  if (typeof window !== 'undefined') {
    stackApp.getUser()?.then(result => { 
      authState.user.name = result?.displayName ?? "Not Authenticated";
      authState.user.email = result?.primaryEmail ?? "not@authenticated";
    })
  }
  
} else {
  authState.user.name = "Dummy User";
  authState.user.email = "dummy@user";
}

export { stackApp };
