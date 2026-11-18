import { getRequestListener } from '@hono/node-server'
import { app } from '../src/app'

const listener = getRequestListener(app.fetch)

export const config = {
  runtime: 'nodejs'
}

// Handler serverless da che do ho tro ca moi truong Web Request va Node Listener
export default function handler(req: any, res: any) {
  try {
    // Xu ly truong hop Vercel rewrite route dan den duong dan /api/index
    if (req && typeof req.url === 'string') {
      const matchedPath = req.headers?.['x-matched-path']
      if (matchedPath && (req.url === '/api/index' || req.url.startsWith('/api/index?'))) {
        const queryIndex = req.url.indexOf('?')
        const query = queryIndex !== -1 ? req.url.slice(queryIndex) : ''
        req.url = matchedPath + query
      }
    }

    if (req instanceof Request || (req && !res && typeof req.url === 'string')) {
      return app.fetch(req)
    }

    return listener(req, res)
  } catch (err: any) {
    console.error('Loi thuc thi Serverless Function:', err)
    if (res && typeof res.writeHead === 'function') {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ success: false, message: err?.message || 'Loi khoi tao may chu serverless' }))
      return
    }
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Loi khoi tao may chu serverless' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
