import { useRouter } from "next/navigation";

import type { AuthService } from "./types";
import { userStore } from "~/stores/userStore";

import { StackClientApp } from "@stackframe/react";

let _stackApp: StackClientApp<true, string> | undefined;

function getStackApp(): StackClientApp<true, string> {
  if (!_stackApp) {
    _stackApp = new StackClientApp({
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
  }

  return _stackApp;
}

const authService: AuthService = {
  async ensureSignedIn() {
    if (typeof window !== "undefined") {
      const user = await getStackApp().getUser({ or: "redirect" });

      if (user) {
        userStore.user = {
          email: user.primaryEmail ?? "",
          name: user.displayName ?? "",
          avatar: user.profileImageUrl ?? "",
        };
      }
    }
  },

  async generateApiKey() {
    const user = await getStackApp().getUser();
    if (user) {
      const apiKey = await user.createApiKey({
        description: "On-boarding API key",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isPublic: false,
      });
      return apiKey.id;
    } else {
      return "Error: Not authenticated";
    }
  },
};

export { authService, getStackApp };
