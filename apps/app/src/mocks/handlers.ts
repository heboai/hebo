import { http, HttpResponse, delay } from 'msw';
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
    
    // Simulate a delay of 1.5 seconds
    await delay(1500);

    return HttpResponse.json(newAgent, { status: 201 });
  }),

  // Get all agents
  http.get('/api/agents', async () => {
    const agents = db.getCollection('agents').records;
    
    // Simulate a delay of 1 second
    await delay(1000);

    return HttpResponse.json(agents);
  }),
];
