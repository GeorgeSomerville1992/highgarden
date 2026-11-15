import { describe, expect, it } from 'vitest'
import { markAllRead, markRead, pruneReadIds } from './readState.ts'
import type { FeedCache } from './types.ts'

describe('read state', () => {
  it('adds an opened item once', () => {
    const read = markRead({ lastReadAt: 0, readIds: [] }, 'a')
    expect(read.readIds).toEqual(['a'])
    expect(markRead(read, 'a')).toBe(read)
  })

  it('moves lastReadAt and clears opened items on Mark all as read', () => {
    expect(markAllRead(42)).toEqual({ lastReadAt: 42, readIds: [] })
  })

  it('forgets opened items that are gone or already older than lastReadAt', () => {
    const cache: FeedCache = {
      feeds: {
        f: {
          items: [
            { id: 'new', feedId: 'f', title: 'New', url: 'https://example.com/new', publishedAt: 20 },
            { id: 'old', feedId: 'f', title: 'Old', url: 'https://example.com/old', publishedAt: 5 },
          ],
        },
      },
    }
    const read = { lastReadAt: 10, readIds: ['new', 'old', 'gone'] }
    expect(pruneReadIds(read, cache).readIds).toEqual(['new'])
    const tidy = { lastReadAt: 10, readIds: ['new'] }
    expect(pruneReadIds(tidy, cache)).toBe(tidy)
  })
})
