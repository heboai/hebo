import { useRouter } from "next/navigation";

import type { AuthService } from "./types";
import { userStore } from "~/stores/userStore";

import { StackClientApp } from "@stackframe/react";

const stackApp = new StackClientApp({
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
    useNavigate: () => {
      return useRouter().push;
    },
  },
});

const authService: AuthService = {
  async ensureSignedIn(redirect?: boolean) {
    if (typeof window !== "undefined") {
      stackApp
        .getUser(redirect ? { or: "redirect" } : undefined)
        ?.then((result) => {
          if (result) {
            userStore.user = {
              email: result.primaryEmail ?? "",
              name: result.displayName ?? "",
              avatar: result.profileImageUrl ?? "",
            };
          }
        });
    }
  },

  async generateApiKey() {
    const user = await stackApp.getUser();
    
    // TODO: handle / throw errors

    let keyId = "";

    if (user) {
      const apiKey = await user.createApiKey({
        description: "On-boarding API key",
        expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
        isPublic: false,
      });

      keyId = apiKey.id;
    }

    return keyId;
  }
};

export { stackApp, authService };
