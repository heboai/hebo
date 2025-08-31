import { setupWorker } from "msw/browser";

import { agentHandlers } from "~console/mocks/agents";
import { branchHandlers } from "~console/mocks/branches";

export const worker = setupWorker(...agentHandlers, ...branchHandlers);
