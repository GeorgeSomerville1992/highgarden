/** A public feed URL, or the name of a server-side env var that holds a private one. */
export type FeedSource = string | { env: string }

export type FeedConfig = {
  id: string
  name: string
  url: FeedSource
  /** Email newsletter turned into a feed (e.g. Kill the Newsletter). */
  kind?: 'newsletter'
  /** Drop items whose title ends with this, e.g. dictionary sub-entries. */
  collapseTitleSuffix?: string
  /** Keep only the newest N items from this feed. */
  maxItems?: number
  /** Keep at most N items per calendar day from this feed. */
  maxPerDay?: number
}

export type Accent = { light: string; dark: string }

export type ColumnConfig = {
  id: string
  name: string
  accent: Accent
  feeds: FeedConfig[]
}

export type FeedItem = {
  /** `${feedId}:${guid | id | link}` */
  id: string
  feedId: string
  title: string
  url: string
  /** Epoch ms. Falls back to first-seen time when the feed has no usable date. */
  publishedAt: number
  summary?: string
  /** Newsletters only: normalised outbound links, used to hide duplicates of site posts. */
  links?: string[]
}

export type FeedState = {
  items: FeedItem[]
  /** Epoch ms of the last successful fetch. */
  fetchedAt?: number
  /** Set when the most recent fetch failed. */
  error?: string
}

export type FeedCache = {
  feeds: Record<string, FeedState>
  /** Epoch ms of the last check where at least one feed succeeded. */
  checkedAt?: number
}

export type ReadState = {
  /** Anything published at or before this counts as read. */
  lastReadAt: number
  /** Items opened since `lastReadAt`. */
  readIds: string[]
}
