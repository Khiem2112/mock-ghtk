import { app } from '../src/app'

export const config = {
  runtime: 'edge'
}

// Handler serverless tren moi truong Edge Runtime cua Vercel
export default async function handler(req: Request): Promise<Response> {
  try {
    // Xu ly phuc hoi duong dan goc tu header x-matched-path neu bi rewrite
    const matchedPath = req.headers.get('x-matched-path')
    if (matchedPath) {
      const url = new URL(req.url)
      if (url.pathname !== matchedPath) {
        url.pathname = matchedPath
        return await app.fetch(new Request(url.toString(), req))
      }
    }
    return await app.fetch(req)
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: err?.message || 'Loi Edge Function',
        stack: err?.stack || ''
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
