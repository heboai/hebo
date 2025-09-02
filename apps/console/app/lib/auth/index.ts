import { isStackAuthEnabled } from "~console/lib/env";

// FUTURE: use dynamic imports to enable tree shaking
import * as dummy from "./dummy-auth";
import * as stack from "./stack-auth";

import type { AuthService } from "./types";

const authService: AuthService = isStackAuthEnabled
  ? stack.authService
  : (console.warn(" ⚠️ No auth configured, using dummy"), dummy.authService);

export { authService };
