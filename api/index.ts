import { app } from '../src/app'

export const config = {
  runtime: 'edge'
}

// Handler serverless tren moi truong Edge Runtime cua Vercel
export default function handler(req: Request) {
  // Xu ly phuc hoi duong dan goc tu header x-matched-path neu bi rewrite
  const matchedPath = req.headers.get('x-matched-path')
  if (matchedPath) {
    const url = new URL(req.url)
    if (url.pathname !== matchedPath) {
      url.pathname = matchedPath
      return app.fetch(new Request(url.toString(), req))
    }
  }
  return app.fetch(req)
}
