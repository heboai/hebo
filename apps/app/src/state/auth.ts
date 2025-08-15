import { proxy } from "valtio";

import type { User } from "~/lib/auth/types";

export const userStore = proxy<{ user: User | undefined }>({
  user: undefined,
});
