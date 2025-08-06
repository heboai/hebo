// src/index.ts
import { Elysia } from 'elysia';
import { authenticateUser } from './middlewares/auth';
import { handleGetVersion } from './api';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const app = new Elysia()
  .get('/', () => 'Hebo API says hello!')
  .group('/api', api =>
    api.guard({}, a =>
      a.use(authenticateUser()).get('/version', () => handleGetVersion()),
    ),
  )
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 418;
      return { success: false, error: "I'm a teapot", timestamp: new Date().toISOString() };
    }
    console.error('API Error:', error);
    set.status = 500;
    return { success: false, error: 'Internal server error', timestamp: new Date().toISOString() };
  });

// explicitly start the server
Bun.serve({
  port: PORT,
  fetch: app.fetch,
  development: false, // optional – mirrors your previous flag
});

console.log(`🚀  Hebo API listening on port ${PORT}`);
console.log(`📊 Runtime: Bun ${process.version}`);