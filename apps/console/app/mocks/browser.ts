import { setupWorker } from "msw/browser";

import { agentHandlers } from "~console/mocks/agents";
import { branchHandlers } from "~console/mocks/branches";
import { providerHandlers } from "~console/mocks/providers";

import { addChaos } from "./chaos";
import { addDelays } from "./delays";

let handlers = [...agentHandlers, ...branchHandlers, ...providerHandlers];

const CHAOS =
  import.meta.env.DEV && import.meta.env.VITE_CHAOS_DISABLE !== "true";
handlers = addDelays(CHAOS ? addChaos(handlers) : handlers);

export const worker = setupWorker(...handlers);
