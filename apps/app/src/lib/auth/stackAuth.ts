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

  async generateAPIKey() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const key = Array.from(
      crypto.getRandomValues(new Uint8Array(32)),
    )
      .map(
        (x) =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[
            x % 62
          ],
      )
      .join("");

    return "DUMMY-" + key;
  }
};

export { stackApp, authService };
