import { normalizeLink } from './normalize.ts'
import type { ColumnConfig, FeedCache, FeedItem, ReadState } from './types.ts'

export type ItemView = FeedItem & {
  source: string
  isNewsletter: boolean
  isNew: boolean
  /** Render the "Earlier" divider above this item. */
  divider: boolean
}

export type ColumnView = {
  column: ColumnConfig
  items: ItemView[]
  newCount: number
  /** "Design Systems Collective 4 · Brad Frost 1", or "Nothing new". */
  breakdown: string
  sources: string
  footnote?: string
  failedFeeds: { id: string; name: string }[]
}

export function buildColumn(column: ColumnConfig, cache: FeedCache, read: ReadState): ColumnView {
  const siteLinks = new Set<string>()
  for (const feed of column.feeds) {
    if (feed.kind === 'newsletter') continue
    for (const item of cache.feeds[feed.id]?.items ?? []) {
      const link = normalizeLink(item.url)
      if (link) siteLinks.add(link)
    }
  }

  // Mix every feed in the column together, hiding newsletter issues that link to a post already shown.
  const mixed = column.feeds.flatMap((feed) => {
    const isNewsletter = feed.kind === 'newsletter'
    return (cache.feeds[feed.id]?.items ?? [])
      .filter((item) => !isNewsletter || !item.links?.some((link) => siteLinks.has(link)))
      .map((item) => ({ ...item, source: feed.name, isNewsletter }))
  })
  mixed.sort((a, b) => b.publishedAt - a.publishedAt)

  const readIds = new Set(read.readIds)
  let seenOld = false
  const items = mixed.map((item, index): ItemView => {
    const isOld = item.publishedAt <= read.lastReadAt
    const divider = isOld && !seenOld && index > 0
    if (isOld) seenOld = true
    return { ...item, isNew: !isOld && !readIds.has(item.id), divider }
  })

  const newBySource = new Map<string, number>()
  for (const item of items) {
    if (item.isNew) newBySource.set(item.source, (newBySource.get(item.source) ?? 0) + 1)
  }

  const footnotes = column.feeds
    .filter((feed) => feed.kind === 'newsletter')
    .filter((feed) => {
      const state = cache.feeds[feed.id]
      return state?.fetchedAt !== undefined && state.items.length === 0
    })
    .map((feed) => `${feed.name} is connected. Issues will appear here once they start arriving.`)

  return {
    column,
    items,
    newCount: items.filter((item) => item.isNew).length,
    breakdown: newBySource.size
      ? [...newBySource].map(([source, count]) => `${source} ${count}`).join(' · ')
      : 'Nothing new',
    sources: column.feeds.map((feed) => feed.name).join(' · '),
    footnote: footnotes.length ? footnotes.join(' ') : undefined,
    failedFeeds: column.feeds
      .filter((feed) => cache.feeds[feed.id]?.error)
      .map((feed) => ({ id: feed.id, name: feed.name })),
  }
}
