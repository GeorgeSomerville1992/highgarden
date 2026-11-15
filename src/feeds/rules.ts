import { clampText, collapseWhitespace, decodeEntities, normalizeLink, safeUrl, toText } from './normalize.ts'
import type { RawItem } from './parse.ts'
import type { FeedConfig, FeedItem } from './types.ts'

const MAX_CACHED_ITEMS = 30
const SUMMARY_LENGTH = 200
const NEWSLETTER_SUMMARY_LENGTH = 140
const MIN_NEWSLETTER_SUMMARY = 20
const MAX_NEWSLETTER_LINKS = 50

/**
 * Raw parsed entries → the items we cache and show, with the feed's rules applied.
 * `previous` is this feed's cached items, used to keep a stable date for undated entries.
 */
export function toFeedItems(feed: FeedConfig, raw: RawItem[], previous: FeedItem[], now: number): FeedItem[] {
  const previousDates = new Map(previous.map((item) => [item.id, item.publishedAt]))
  const seen = new Set<string>()
  const items: FeedItem[] = []

  for (const entry of raw) {
    const url = safeUrl(entry.link)
    if (!url) continue
    const id = `${feed.id}:${entry.guid ?? url}`
    if (seen.has(id)) continue
    seen.add(id)

    let title = entry.titleIsHtml ? toText(entry.title) : decodeEntities(entry.title)
    if (feed.collapseTitleSuffix && title.endsWith(feed.collapseTitleSuffix)) continue

    let summary: string | undefined
    const separator = feed.titleSummarySeparator ? title.indexOf(feed.titleSummarySeparator) : -1
    if (feed.titleSummarySeparator && separator > 0) {
      summary = clampText(title.slice(separator + feed.titleSummarySeparator.length), SUMMARY_LENGTH)
      title = title.slice(0, separator)
    }

    const parsedDate = Date.parse(entry.date ?? '')
    const item: FeedItem = {
      id,
      feedId: feed.id,
      title: title || 'Untitled',
      url,
      publishedAt: Number.isNaN(parsedDate) ? (previousDates.get(id) ?? now) : parsedDate,
    }

    if (feed.kind === 'newsletter') {
      const html = entry.contentHtml ?? entry.summaryHtml ?? ''
      item.summary = newsletterSummary(html)
      item.links = outboundLinks(html)
    } else {
      item.summary = summary ?? siteSummary(entry.summaryHtml, item.title)
    }
    items.push(item)
  }

  return limit(feed, items)
}

/** Newest first, then the per-day and per-feed caps. */
function limit(feed: FeedConfig, items: FeedItem[]): FeedItem[] {
  items.sort((a, b) => b.publishedAt - a.publishedAt)
  const { maxPerDay } = feed
  let kept = items
  if (maxPerDay) {
    const perDay = new Map<string, number>()
    kept = kept.filter((item) => {
      const day = new Date(item.publishedAt).toDateString()
      const count = perDay.get(day) ?? 0
      perDay.set(day, count + 1)
      return count < maxPerDay
    })
  }
  return kept.slice(0, Math.min(feed.maxItems ?? MAX_CACHED_ITEMS, MAX_CACHED_ITEMS))
}

/** Feed description as one short line. Only the description: full article content makes poor summaries. */
function siteSummary(html: string | undefined, title: string): string | undefined {
  if (!html) return undefined
  const text = toText(html)
    .replace(/^(summary|description|show notes)\b:?\s*/i, '') // podcast show notes
    .replace(/\s*Continue reading on .*»$/, '') // Medium
    .replace(/\s*The post .* appeared first on .*$/, '') // WordPress
    .trim()
  if (!text || text === title) return undefined
  return clampText(text, SUMMARY_LENGTH)
}

/** Plain-text start of an email, or nothing if what's left isn't mostly words. */
function newsletterSummary(html: string): string | undefined {
  const text = collapseWhitespace(toText(html).replace(/https?:\/\/\S+/g, ''))
  if (text.length < MIN_NEWSLETTER_SUMMARY) return undefined
  const letters = text.match(/\p{L}/gu)?.length ?? 0
  if (letters / text.length < 0.5) return undefined
  return clampText(text, NEWSLETTER_SUMMARY_LENGTH)
}

/** Links an email points to, minus homepages and mailing-list plumbing. Used to spot repeats of site posts. */
function outboundLinks(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const links = new Set<string>()
  for (const anchor of doc.querySelectorAll('a[href]')) {
    const link = normalizeLink(anchor.getAttribute('href') ?? '')
    if (!link || isBoilerplateLink(link)) continue
    links.add(link)
    if (links.size >= MAX_NEWSLETTER_LINKS) break
  }
  return [...links]
}

function isBoilerplateLink(link: string): boolean {
  const slash = link.indexOf('/')
  if (slash === -1) return true // a homepage
  const host = link.slice(0, slash)
  const path = link.slice(slash)
  return host === 'kill-the-newsletter.com' || /\/(unsubscribe|confirm|preferences|manage|subscribe)\b/i.test(path)
}
