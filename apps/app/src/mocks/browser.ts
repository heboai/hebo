import { setupWorker } from 'msw/browser';
import { agentHandlers } from '~/mocks/agents';

export const worker = setupWorker(...agentHandlers);