import { http, HttpResponse } from 'msw';
import db from '~/mocks/db';

interface AgentData {
  agentName: string;
  models: string[];
}

export const handlers = [
  // Create a new agent
  http.post('/api/agents', async ({ request }) => {
    const body = await request.json() as AgentData;
    const newAgent = db.getCollection('agents').insert(body);
    return HttpResponse.json(newAgent, { status: 201 });
  }),

  // Get all agents
  http.get('/api/agents', () => {
    const agents = db.getCollection('agents').records;
    return HttpResponse.json(agents);
  }),
]; 