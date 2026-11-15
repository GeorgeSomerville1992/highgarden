import { findFeed } from '../src/feeds/config.ts'

// GET /api/feed?id=<feed id> → the upstream feed's XML.
// Looks feeds up by id so this can't be used as an open proxy, and resolves
// private (newsletter) URLs from env vars so they never reach the browser.

const TIMEOUT_MS = 8_000
const MAX_BYTES = 2 * 1024 * 1024

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return text('Method not allowed', 405, { Allow: 'GET' })
    }

    const id = new URL(request.url).searchParams.get('id')
    const feed = id ? findFeed(id) : undefined
    if (!feed) return text('Unknown feed', 404)

    const url = typeof feed.url === 'string' ? feed.url : process.env[feed.url.env]
    if (!url) return text('Feed not configured', 500)

    let upstream: Response
    try {
      upstream = await fetch(url, {
        headers: {
          'User-Agent': 'LearningFeed/1.0 (personal start page)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.5',
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
    } catch {
      return text('Upstream unreachable', 502)
    }
    if (!upstream.ok) return text(`Upstream responded ${upstream.status}`, 502)

    const declared = Number(upstream.headers.get('Content-Length'))
    if (declared > MAX_BYTES) return text('Upstream feed too large', 502)
    const body = await upstream.arrayBuffer()
    if (body.byteLength > MAX_BYTES) return text('Upstream feed too large', 502)

    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
      },
    })
  },
}

function text(message: string, status: number, headers: Record<string, string> = {}): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}
