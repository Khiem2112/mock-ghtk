import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { initDatabase } from './db'
import { seedDatabase } from './seed'
import { ghtkApiRouter } from './routes/ghtk_api'
import { uiApiRouter } from './routes/ui_api'
import { renderDashboardHtml } from './views/dashboard'

// Khoi tao co so du lieu sqlite va nap seed data neu co so du lieu trong
initDatabase()
seedDatabase(false)

export const app = new Hono()

app.use('*', logger())
app.use('*', cors())

// Giao dien dieu khien va thu nghiem webhook truc quan
app.get('/', (c) => {
  return c.html(renderDashboardHtml())
})

app.get('/admin', (c) => {
  return c.html(renderDashboardHtml())
})

// Gan cac router API mock GHTK va router quan ly UI
app.route('/', ghtkApiRouter)
app.route('/', uiApiRouter)

// Xy ly route khong ton tai
app.notFound((c) => {
  return c.json({
    success: false,
    message: `Khong tim thay endpoint: ${c.req.method} ${c.req.path}`
  }, 404)
})

// Xu ly bat loi he thong
app.onError((err, c) => {
  console.error('Loi may chu:', err)
  return c.json({
    success: false,
    message: err.message || 'Loi noi bo may chu'
  }, 500)
})
