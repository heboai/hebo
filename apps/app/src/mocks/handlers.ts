import { http, HttpResponse } from 'msw';
import db from '~/mocks/db';

interface AgentData {
  agentName: string;
  models: string[];
}

export const handlers = [
  // Create a new agent
  http.post('/api/agents', async ({ request }) => {
    try {
      const body = await request.json() as AgentData;
      const newAgent = db.getCollection('agents').insert(body);
      return HttpResponse.json(newAgent, { status: 201 });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to create agent' }, { status: 400 });
    }
  }),

  // Get all agents
  http.get('/api/agents', () => {
    try {
      const agents = db.getCollection('agents').records;
      return HttpResponse.json(agents);
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }
  }),
]; 