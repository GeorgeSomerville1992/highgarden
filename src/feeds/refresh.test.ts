import { afterEach, describe, expect, it, vi } from 'vitest'
import reactBlog from './__fixtures__/react-blog.xml?raw'
import storybook from './__fixtures__/storybook.xml?raw'
import { findFeed } from './config.ts'
import { refreshFeeds } from './refresh.ts'
import type { FeedCache, FeedConfig } from './types.ts'

const NOW = Date.UTC(2026, 10, 15, 9)
const reactBlogFeed = findFeed('react-blog') as FeedConfig
const storybookFeed = findFeed('storybook') as FeedConfig

function stubFeeds(responses: Record<string, Response | Error>) {
  const fetch = vi.fn(async (input: string) => {
    const id = new URL(input, 'https://start.example').searchParams.get('id') ?? ''
    const response = responses[id]
    if (response instanceof Error) throw response
    return response.clone()
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => vi.unstubAllGlobals())

describe('refreshFeeds', () => {
  it('fetches each feed through the proxy and caches its items', async () => {
    const fetch = stubFeeds({ 'react-blog': new Response(reactBlog), storybook: new Response(storybook) })

    const { cache, unseen } = await refreshFeeds([reactBlogFeed, storybookFeed], { feeds: {} }, NOW)

    expect(fetch).toHaveBeenCalledWith('/api/feed?id=react-blog')
    expect(cache.checkedAt).toBe(NOW)
    expect(cache.feeds['react-blog']).toMatchObject({ fetchedAt: NOW, items: expect.any(Array) })
    expect(cache.feeds['react-blog'].items[0].title).toBe('React 19.3')
    expect(cache.feeds.storybook.items).toHaveLength(2)
    expect(unseen).toEqual([]) // first fetch of a feed never counts as "unseen"
  })

  it('reports items that were not cached before', async () => {
    stubFeeds({ 'react-blog': new Response(reactBlog) })
    const first = await refreshFeeds([reactBlogFeed], { feeds: {} }, NOW)
    const [newest, ...rest] = first.cache.feeds['react-blog'].items
    const before: FeedCache = { feeds: { 'react-blog': { items: rest, fetchedAt: NOW - 1 } } }

    const { unseen } = await refreshFeeds([reactBlogFeed], before, NOW)

    expect(unseen.map((item) => item.title)).toEqual([newest.title])
  })

  it('keeps cached items and records the error when a feed fails', async () => {
    const cached = { id: 'storybook:1', feedId: 'storybook', title: 'Cached', url: 'https://storybook.js.org/blog/x/', publishedAt: 1 }
    const before: FeedCache = { checkedAt: 5, feeds: { storybook: { items: [cached], fetchedAt: 5 } } }

    stubFeeds({ storybook: new Response('Upstream responded 503', { status: 502 }) })
    const failed = await refreshFeeds([storybookFeed], before, NOW)
    expect(failed.cache.feeds.storybook).toMatchObject({ items: [cached], fetchedAt: 5, error: expect.stringContaining('502') })
    expect(failed.cache.checkedAt).toBe(5) // no feed succeeded

    stubFeeds({ storybook: new Response('<html>Not a feed</html>') })
    const broken = await refreshFeeds([storybookFeed], before, NOW)
    expect(broken.cache.feeds.storybook.error).toContain('Unsupported feed format')

    stubFeeds({ storybook: new TypeError('Failed to fetch') })
    const offline = await refreshFeeds([storybookFeed], before, NOW)
    expect(offline.cache.feeds.storybook).toMatchObject({ items: [cached], error: 'Failed to fetch' })
  })

  it('clears a previous error once the feed works again', async () => {
    stubFeeds({ 'react-blog': new Response(reactBlog) })
    const before: FeedCache = { feeds: { 'react-blog': { items: [], error: 'Failed to fetch' } } }
    const { cache } = await refreshFeeds([reactBlogFeed], before, NOW)
    expect(cache.feeds['react-blog'].error).toBeUndefined()
  })
})
