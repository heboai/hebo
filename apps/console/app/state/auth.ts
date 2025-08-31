import { proxy } from "valtio";

import type { User } from "~console/lib/auth/types";

export const authStore = proxy<{ user: User | undefined }>({
  user: undefined,
});
