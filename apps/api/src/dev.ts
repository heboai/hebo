import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { handleGetVersion } from './api'

const app = new Hono()

app.get('/api/version', async (c) => {
  const result = await handleGetVersion()
  return c.json(result)
})

const port = 3001
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
}) 