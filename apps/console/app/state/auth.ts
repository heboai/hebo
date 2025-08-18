import { proxy } from "valtio";

import type { User } from "~/lib/auth/types";

export const authStore = proxy<{ user: User | undefined }>({
  user: undefined,
});
