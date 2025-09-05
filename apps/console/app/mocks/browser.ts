import { setupWorker } from "msw/browser";

import { agentHandlers } from "~console/mocks/agents";
import { branchHandlers } from "~console/mocks/branches";

import { addChaos } from "./chaos";

const handlers = [...agentHandlers, ...branchHandlers];

const CHAOS = import.meta.env.DEV && !import.meta.env.VITE_CHAOS_DISABLE;
export const worker = setupWorker(...(CHAOS ? addChaos(handlers) : handlers));
