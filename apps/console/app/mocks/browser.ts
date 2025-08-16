import { setupWorker } from "msw/browser";

import { agentHandlers } from "~/mocks/agents";
import { branchHandlers } from "~/mocks/branches";

export const worker = setupWorker(...agentHandlers, ...branchHandlers);
