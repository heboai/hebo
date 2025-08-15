import { StackClientApp } from "@stackframe/react";

import { userStore } from "~/state/auth";

import type { AuthService } from "./types";

let _stackApp: StackClientApp<true, string> | undefined;

const getStackApp = (): StackClientApp<true, string> => {
  if (!_stackApp) {
    _stackApp = new StackClientApp({
      projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
      publishableClientKey:
        process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
      tokenStore: "cookie",
      urls: {
        signIn: "/signin",
        signUp: "/signin",
        accountSettings: "/settings",
        home: "/",
      },
      redirectMethod: {
        useNavigate,
      },
    });
  }

  return _stackApp;
};

const authService = {
  ensureSignedIn() {
    const user = getStackApp().useUser({ or: "redirect" });

    if (!user) return;
    userStore.user = {
      email: user.primaryEmail ?? "",
      name: user.displayName ?? "",
      avatar: user.profileImageUrl ?? "",
    };
  },

  async generateApiKey() {
    const user = await getStackApp().getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    const apiKey = await user.createApiKey({
      description: "On-boarding API key",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isPublic: false,
    });
    return apiKey.value;
  },
} satisfies AuthService;

export { authService, getStackApp };
