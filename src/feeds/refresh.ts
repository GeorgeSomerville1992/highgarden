import { parseFeed, type RawItem } from './parse.ts'
import { toFeedItems } from './rules.ts'
import type { FeedCache, FeedConfig, FeedItem } from './types.ts'

export type RefreshResult = {
  cache: FeedCache
  /** Items that weren't in the cache before. Empty on a feed's first fetch, so a first visit doesn't notify. */
  unseen: FeedItem[]
}

/** Fetch feeds through /api/feed in parallel. A failed feed keeps its cached items and records the error. */
export async function refreshFeeds(feeds: FeedConfig[], cache: FeedCache, now = Date.now()): Promise<RefreshResult> {
  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed)))
  const next: FeedCache = { ...cache, feeds: { ...cache.feeds } }
  const unseen: FeedItem[] = []

  results.forEach((result, index) => {
    const feed = feeds[index]
    const previous = cache.feeds[feed.id]
    if (result.status === 'rejected') {
      next.feeds[feed.id] = { ...previous, items: previous?.items ?? [], error: errorMessage(result.reason) }
      return
    }
    const items = toFeedItems(feed, result.value, previous?.items ?? [], now)
    if (previous?.fetchedAt !== undefined) {
      const known = new Set(previous.items.map((item) => item.id))
      unseen.push(...items.filter((item) => !known.has(item.id)))
    }
    next.feeds[feed.id] = { items, fetchedAt: now }
    next.checkedAt = now
  })

  return { cache: next, unseen }
}

/** A broken feed throws while parsing, so it's reported like a network failure. */
async function fetchFeed(feed: FeedConfig): Promise<RawItem[]> {
  const response = await fetch(`/api/feed?id=${encodeURIComponent(feed.id)}`)
  if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 100)}`)
  return parseFeed(await response.text())
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason)
}
