import {Hono} from 'hono'
import {handleGetVersion} from './api'
import {authenticateUser} from './middlewares/auth'
import {except} from 'hono/combine'

const app = new Hono()

app.use('/api/*', except('/api/verion', authenticateUser()))

app.get('/', (c) => {
  return c.text('Hebo API says hello!')
})

app.get('/api/version', async (c) => {
  const result = await handleGetVersion()
  return c.json(result)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'I\'m a teapot',
    timestamp: new Date().toISOString()
  }, 418)
})

// Error handler
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  }, 500)
})

const port = parseInt(process.env.PORT || '3001')
console.log(`🚀 Hebo API server starting on port ${port}`)
console.log(`📊 Runtime: Bun ${process.version}`)

const server = {
  port,
  fetch: app.fetch
}

export default server 