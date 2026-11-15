import type { FeedCache, ReadState } from './types.ts'

export function markRead(read: ReadState, id: string): ReadState {
  return read.readIds.includes(id) ? read : { ...read, readIds: [...read.readIds, id] }
}

/** Anything published before now counts as read; the opened-items list starts over. */
export function markAllRead(now: number): ReadState {
  return { lastReadAt: now, readIds: [] }
}

/** Forget opened items that are no longer cached or are already covered by lastReadAt. */
export function pruneReadIds(read: ReadState, cache: FeedCache): ReadState {
  const live = new Set(
    Object.values(cache.feeds)
      .flatMap((feed) => feed.items)
      .filter((item) => item.publishedAt > read.lastReadAt)
      .map((item) => item.id),
  )
  const readIds = read.readIds.filter((id) => live.has(id))
  return readIds.length === read.readIds.length ? read : { ...read, readIds }
}
