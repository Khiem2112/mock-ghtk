import { handle } from '@hono/node-server/vercel'
import { app } from '../src/app'

const listener = handle(app)

export const config = {
  runtime: 'nodejs'
}

// Handler tiep nhan request tren moi truong Serverless cua Vercel
export default function handler(req: any, res: any) {
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
}

handler.fetch = app.fetch
