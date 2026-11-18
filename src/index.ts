import { serve } from '@hono/node-server'
import { app } from './app'

const port = Number(process.env.PORT) || 4001

console.log(`GHTK Mock Server dang chay tai: http://localhost:${port}`)
console.log(`Giao dien quan ly va thu nghiem Webhook: http://localhost:${port}/`)

serve({
  fetch: app.fetch,
  port
})
