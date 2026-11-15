import { useEffect, useState } from 'react'
import { feeds } from '../feeds/config.ts'
import { pruneReadIds } from '../feeds/readState.ts'
import { refreshFeeds } from '../feeds/refresh.ts'
import type { FeedConfig } from '../feeds/types.ts'
import { getStored, setStored } from '../storage/storage.ts'
import { notifyNewItems } from './notify.ts'

const CHECK_EVERY_MS = 30 * 60_000
/** Opening the page skips the fetch if the last check is newer than this (the CDN caches for 5 min anyway). */
const FRESH_FOR_MS = 5 * 60_000

/**
 * Checks feeds after first paint, every 30 minutes while the page is open, and when the tab
 * comes back after a long gap. Returns a manual refresh for the Refresh and retry buttons.
 */
export function useFeedRefresh() {
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const refreshIfOlderThan = (maxAge: number) => {
      const { checkedAt } = getStored('cache')
      if (checkedAt === undefined || Date.now() - checkedAt > maxAge) void runRefresh(feeds)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshIfOlderThan(CHECK_EVERY_MS)
    }

    refreshIfOlderThan(FRESH_FOR_MS)
    const interval = setInterval(() => void runRefresh(feeds), CHECK_EVERY_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  async function refresh(feedsToRefresh: FeedConfig[] = feeds) {
    setRefreshing(true)
    try {
      await runRefresh(feedsToRefresh)
    } finally {
      setRefreshing(false)
    }
  }

  return { refreshing, refresh }
}

async function runRefresh(feedsToRefresh: FeedConfig[]): Promise<void> {
  await withLock(async () => {
    const { cache, unseen } = await refreshFeeds(feedsToRefresh, getStored('cache'))
    setStored('cache', cache)
    const read = pruneReadIds(getStored('read'), cache)
    if (read !== getStored('read')) setStored('read', read)
    notifyNewItems(unseen.filter((item) => item.publishedAt > read.lastReadAt))
  })
}

/** One refresh at a time across every open tab; the others pick up the result via storage events. */
async function withLock(task: () => Promise<void>): Promise<void> {
  if (!('locks' in navigator)) return task()
  await navigator.locks.request('feed-refresh', { ifAvailable: true }, async (lock) => {
    if (lock) await task()
  })
}
