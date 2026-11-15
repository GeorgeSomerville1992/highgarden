import { describe, expect, it } from 'vitest'
import aiEngineeringPodcast from './__fixtures__/ai-engineering-podcast.xml?raw'
import ahmadShadeed from './__fixtures__/ahmad-shadeed.xml?raw'
import aihero from './__fixtures__/aihero.xml?raw'
import dsc from './__fixtures__/dsc.xml?raw'
import newsletter from './__fixtures__/newsletter.xml?raw'
import twir from './__fixtures__/twir.xml?raw'
import { findFeed } from './config.ts'
import { parseFeed, type RawItem } from './parse.ts'
import { toFeedItems } from './rules.ts'
import type { FeedConfig } from './types.ts'

const NOW = Date.UTC(2026, 10, 15, 9)

function feed(id: string): FeedConfig {
  const config = findFeed(id)
  if (!config) throw new Error(`No feed ${id} in config`)
  return config
}

function items(id: string, xml: string) {
  return toFeedItems(feed(id), parseFeed(xml), [], NOW)
}

describe('toFeedItems', () => {
  it('collapses AI Coding Dictionary sub-entries into the parent', () => {
    const titles = items('aihero', aihero).map((item) => item.title)
    expect(titles).toContain('AI Coding Dictionary')
    expect(titles.some((title) => title.endsWith('| AI Coding Dictionary'))).toBe(false)
  })

  it('splits This Week In React titles into a title and a summary', () => {
    const [first] = items('twir', twir)
    expect(first.title).toBe('This Week In React #305')
    expect(first.summary).toMatch(/^X, Forms, e18e/)
  })

  it('cleans podcast show-note summaries', () => {
    const [first] = items('ai-engineering-podcast', aiEngineeringPodcast)
    expect(first.summary).toMatch(/^In this episode, I spoke with Jonathan Ellis/)
    expect(first.summary?.length).toBeLessThanOrEqual(201)
    expect(first.summary).not.toContain('<')
  })

  it('caps Design Systems Collective at three posts a day and drops Medium boilerplate', () => {
    const result = items('dsc', dsc)
    const perDay = new Map<string, number>()
    for (const item of result) {
      const day = new Date(item.publishedAt).toDateString()
      perDay.set(day, (perDay.get(day) ?? 0) + 1)
    }
    expect(Math.max(...perDay.values())).toBe(3)
    expect(result.every((item) => !item.summary?.includes('Continue reading'))).toBe(true)
    expect(result.find((item) => item.title === 'Design Systems Are Not Neutral')?.summary).toBe(
      'Every Component Reflects a Product Decision',
    )
  })

  it('sorts oldest-first feeds newest first and leaves out missing summaries', () => {
    const result = items('ahmad-shadeed', ahmadShadeed)
    expect(result[0].publishedAt).toBeGreaterThan(result[1].publishedAt)
    expect(result.every((item) => item.summary === undefined)).toBe(true)
  })

  it('turns newsletter emails into a short plain-text summary and their outbound links', () => {
    const [repeat, unique, confirm] = items('aihero-newsletter', newsletter)
    expect(repeat.title).toBe('The Home Repo Pattern')
    expect(repeat.summary).toBe('Hey friend, I wrote up a pattern I keep reaching for: the home repo pattern. AI Hero · Unsubscribe')
    expect(repeat.links).toEqual(['aihero.dev/the-home-repo-pattern'])

    expect(unique.summary).not.toMatch(/https?:/)
    expect(unique.summary?.length).toBeLessThanOrEqual(141)
    expect(unique.summary).toMatch(/…$/)
    expect(unique.links).toEqual(['example.com/agents-in-production'])

    expect(confirm.summary).toBeUndefined()
    expect(confirm.links).toEqual([])
  })

  it('drops entries without an http(s) link and de-duplicates ids', () => {
    const raw: RawItem[] = [
      { title: 'Script', titleIsHtml: false, link: 'javascript:alert(1)', date: '2026-11-01' },
      { title: 'Data', titleIsHtml: false, link: 'data:text/html,hi', date: '2026-11-01' },
      { guid: 'a', title: 'Kept', titleIsHtml: false, link: 'https://example.com/a', date: '2026-11-01' },
      { guid: 'a', title: 'Duplicate', titleIsHtml: false, link: 'https://example.com/a', date: '2026-11-01' },
    ]
    expect(toFeedItems(feed('react-blog'), raw, [], NOW).map((item) => item.title)).toEqual(['Kept'])
  })

  it('treats titles as text, decoding entities without dropping angle brackets', () => {
    const raw: RawItem[] = [
      { guid: 'a', title: 'The &lt;dialog&gt; element &amp; you', titleIsHtml: false, link: 'https://example.com/a' },
      { guid: 'b', title: 'Using <em>subgrid</em>', titleIsHtml: true, link: 'https://example.com/b' },
    ]
    const titles = toFeedItems(feed('react-blog'), raw, [], NOW).map((item) => item.title)
    expect(titles).toEqual(expect.arrayContaining(['The <dialog> element & you', 'Using subgrid']))
  })

  it('keeps the first-seen date for undated entries', () => {
    const raw: RawItem[] = [{ guid: 'a', title: 'Undated', titleIsHtml: false, link: 'https://example.com/a' }]
    const [first] = toFeedItems(feed('react-blog'), raw, [], NOW)
    expect(first.publishedAt).toBe(NOW)
    const [again] = toFeedItems(feed('react-blog'), raw, [first], NOW + 60_000)
    expect(again.publishedAt).toBe(NOW)
  })

  it('keeps only the newest items', () => {
    const raw: RawItem[] = Array.from({ length: 50 }, (_, i) => ({
      guid: String(i),
      title: `Post ${i}`,
      titleIsHtml: false,
      link: `https://example.com/${i}`,
      date: new Date(Date.UTC(2026, 0, 1 + i)).toUTCString(),
    }))
    expect(toFeedItems(feed('twir'), raw, [], NOW)).toHaveLength(10)
    const capped = toFeedItems(feed('react-blog'), raw, [], NOW)
    expect(capped).toHaveLength(30)
    expect(capped[0].title).toBe('Post 49')
  })
})
