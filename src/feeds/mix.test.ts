import { describe, expect, it } from 'vitest'
import { sampleCache, sampleNow, sampleRead } from './__fixtures__/sample.ts'
import { columns } from './config.ts'
import { buildColumn } from './mix.ts'
import type { FeedCache, ReadState } from './types.ts'

const [ai, react, css, empty] = columns

function views(cache: FeedCache = sampleCache, read: ReadState = sampleRead) {
  return columns.map((column) => buildColumn(column, cache, read))
}

describe('buildColumn with the design sample data', () => {
  it('counts what is new since the last visit', () => {
    expect(views().map((view) => view.newCount)).toEqual([2, 1, 4, 0])
  })

  it('mixes feeds together newest first', () => {
    const css = views()[2]
    const dates = css.items.map((item) => item.publishedAt)
    expect(dates).toEqual([...dates].sort((a, b) => b - a))
    expect(new Set(css.items.map((item) => item.source)).size).toBe(4)
  })

  it('puts the Earlier divider before the first item from before the last visit', () => {
    const ai = views()[0]
    expect(ai.items.map((item) => [item.title, item.isNew, item.divider])).toEqual([
      ['The Home Repo Pattern', true, false],
      ['AI Coding Dictionary', true, false],
      ['AI SDK v6 Crash Course', false, true],
      ['What Do Humans Do Now? Rethinking Software Engineering in the Age of AI Agents', false, false],
      ['How to Evaluate RAG Systems When Ground Truth Keeps Changing', false, false],
      ['Harness Engineering for Reliable, Governed AI Agents', false, false],
    ])
  })

  it('summarises new items by source', () => {
    expect(views().map((view) => view.breakdown)).toEqual([
      'AI Hero 2',
      'This Week In React 1',
      'Design Systems Collective 4',
      'Nothing new',
    ])
    expect(views()[0].sources).toBe('AI Hero · AI Hero newsletter · AI Engineering Podcast')
  })

  it('adds a footnote for connected newsletters with no issues yet', () => {
    expect(views()[0].footnote).toBe('AI Hero newsletter is connected. Issues will appear here once they start arriving.')
    expect(views()[2].footnote).toBeUndefined()
    expect(buildColumn(empty, sampleCache, sampleRead).items).toEqual([])
  })
})

describe('read state', () => {
  it('stops one opened item being new without clearing the rest', () => {
    const opened = sampleCache.feeds.aihero.items[0]
    const view = buildColumn(ai, sampleCache, { ...sampleRead, readIds: [opened.id] })
    expect(view.newCount).toBe(1)
    expect(view.items.find((item) => item.id === opened.id)).toMatchObject({ isNew: false, divider: false })
    expect(view.breakdown).toBe('AI Hero 1')
  })

  it('treats everything as read after Mark all as read', () => {
    const all = views(sampleCache, { lastReadAt: sampleNow.getTime(), readIds: [] })
    expect(all.map((view) => view.newCount)).toEqual([0, 0, 0, 0])
    expect(all.flatMap((view) => view.items).some((item) => item.divider)).toBe(false)
  })
})

describe('newsletters and errors', () => {
  const lastReadAt = Date.UTC(2026, 10, 1)
  const cache: FeedCache = {
    feeds: {
      aihero: {
        fetchedAt: 1,
        items: [{ id: 'aihero:1', feedId: 'aihero', title: 'The Home Repo Pattern', url: 'https://www.aihero.dev/the-home-repo-pattern', publishedAt: Date.UTC(2026, 10, 12) }],
      },
      'aihero-newsletter': {
        fetchedAt: 1,
        items: [
          { id: 'n:1', feedId: 'aihero-newsletter', title: 'Repeat', url: 'https://kill-the-newsletter.com/e/1.html', publishedAt: Date.UTC(2026, 10, 13), links: ['aihero.dev/the-home-repo-pattern'] },
          { id: 'n:2', feedId: 'aihero-newsletter', title: 'Email only', url: 'https://kill-the-newsletter.com/e/2.html', publishedAt: Date.UTC(2026, 10, 14), links: ['example.com/elsewhere'] },
        ],
      },
      'ai-engineering-podcast': { items: [], error: 'Upstream responded 503' },
    },
  }

  it('hides newsletter issues that link to a post already in the column', () => {
    const view = buildColumn(ai, cache, { lastReadAt, readIds: [] })
    expect(view.items.map((item) => [item.title, item.isNewsletter])).toEqual([
      ['Email only', true],
      ['The Home Repo Pattern', false],
    ])
    expect(view.footnote).toBeUndefined()
  })

  it('lists feeds whose last fetch failed', () => {
    expect(buildColumn(ai, cache, { lastReadAt, readIds: [] }).failedFeeds).toEqual([
      { id: 'ai-engineering-podcast', name: 'AI Engineering Podcast' },
    ])
  })

  it('does not claim a newsletter is connected before it has been fetched', () => {
    expect(buildColumn(react, { feeds: {} }, { lastReadAt, readIds: [] }).footnote).toBeUndefined()
    expect(buildColumn(css, { feeds: {} }, { lastReadAt, readIds: [] }).items).toEqual([])
  })
})
