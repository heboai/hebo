import { authService as stackAuthService, stackApp } from "./stackAuth";
import { authService as dummyAuthService } from "./dummyAuth";

const isStackAuthEnabled = !!process.env.NEXT_PUBLIC_STACK_PROJECT_ID;

const authService = isStackAuthEnabled ? stackAuthService : dummyAuthService;

export { authService, isStackAuthEnabled, stackApp };
