import { Collection } from "@msw/data";
import z from "zod";

import { authStore } from "~console/state/auth";

import { DEFAULT_EXPIRATION_MS, type AuthService } from "./types";

const apiKeys = new Collection({
  schema: z.object({
    id: z.string().default(crypto.randomUUID()),
    description: z.string(),
    value: z.string(),
    createdAt: z.date(),
    expiresAt: z.date(),
  }),
});

export const authService = {
  async ensureSignedIn() {
    if (authStore.user) return;
    authStore.user = {
      name: "Dummy User",
      email: "dummy@user.com",
      initials: "DU",
      avatar: "",
    };
  },

  getAccessToken() {
    return "dummy-access-token";
  },

  async generateApiKey(description, expiresIn = DEFAULT_EXPIRATION_MS) {
    const now = new Date();
    const newKey = await apiKeys.create({
      description,
      value: crypto.randomUUID(),
      createdAt: now,
      expiresAt: new Date(now.getTime() + expiresIn),
    });

    return newKey;
  },

  async revokeApiKey(apiKeyId: string) {
    apiKeys.delete((q) => q.where({ id: apiKeyId }));
  },

  async listApiKeys() {
    return apiKeys.findMany();
  },
} satisfies AuthService;
