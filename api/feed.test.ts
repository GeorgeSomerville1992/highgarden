// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './feed.ts'

function get(query: string, init?: RequestInit) {
  return handler.fetch(new Request(`https://start.example/api/feed?${query}`, init))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('GET /api/feed', () => {
  it('relays a configured feed with CDN caching', async () => {
    const upstream = vi.fn(async () => new Response('<rss/>', { status: 200 }))
    vi.stubGlobal('fetch', upstream)

    const response = await get('id=react-blog')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('<rss/>')
    expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8')
    expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=3600')
    expect(upstream).toHaveBeenCalledWith('https://react.dev/rss.xml', expect.anything())
  })

  it('only fetches feeds from the config', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)

    expect((await get('id=nope')).status).toBe(404)
    expect((await get('url=https://evil.example/')).status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('resolves private feed URLs from env vars without exposing them', async () => {
    const upstream = vi.fn(async () => new Response('<feed/>'))
    vi.stubGlobal('fetch', upstream)

    vi.stubEnv('AIHERO_NEWSLETTER_FEED_URL', '')
    const missing = await get('id=aihero-newsletter')
    expect(missing.status).toBe(500)
    expect(upstream).not.toHaveBeenCalled()

    vi.stubEnv('AIHERO_NEWSLETTER_FEED_URL', 'https://kill-the-newsletter.com/feeds/secret.xml')
    const ok = await get('id=aihero-newsletter')
    expect(ok.status).toBe(200)
    expect(upstream).toHaveBeenCalledWith('https://kill-the-newsletter.com/feeds/secret.xml', expect.anything())
  })

  it('reports upstream failures as 502 without leaking the URL', async () => {
    vi.stubEnv('AIHERO_NEWSLETTER_FEED_URL', 'https://kill-the-newsletter.com/feeds/secret.xml')

    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    const failed = await get('id=aihero-newsletter')
    expect(failed.status).toBe(502)
    expect(failed.headers.get('Cache-Control')).toBe('no-store')
    expect(await failed.text()).not.toContain('secret')

    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('fetch failed'))))
    expect((await get('id=aihero-newsletter')).status).toBe(502)
  })

  it('rejects oversized feeds and other methods', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { headers: { 'Content-Length': String(3 * 1024 * 1024) } })))
    expect((await get('id=react-blog')).status).toBe(502)
    expect((await get('id=react-blog', { method: 'POST' })).status).toBe(405)
  })
})
