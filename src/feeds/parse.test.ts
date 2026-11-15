import { describe, expect, it } from 'vitest'
import ahmadShadeed from './__fixtures__/ahmad-shadeed.xml?raw'
import bradFrost from './__fixtures__/brad-frost.xml?raw'
import dsc from './__fixtures__/dsc.xml?raw'
import newsletter from './__fixtures__/newsletter.xml?raw'
import reactBlog from './__fixtures__/react-blog.xml?raw'
import storybook from './__fixtures__/storybook.xml?raw'
import { parseFeed } from './parse.ts'

describe('parseFeed', () => {
  it('reads RSS 2.0 items', () => {
    const [first] = parseFeed(reactBlog)
    expect(first).toEqual({
      guid: 'https://react.dev/blog/2026/09/09/react-19-3',
      title: 'React 19.3',
      titleIsHtml: false,
      link: 'https://react.dev/blog/2026/09/09/react-19-3',
      date: 'Wed, 09 Sep 2026 00:00:00 GMT',
      summaryHtml: expect.stringContaining('React 19.3 adds new features'),
      contentHtml: undefined,
    })
  })

  it('reads content:encoded and dc:creator feeds without confusing namespaced elements', () => {
    const items = parseFeed(storybook)
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({
      guid: expect.stringMatching(/^Ghost__Post__/),
      title: 'How to document your design system: best practices & tools',
      link: 'https://storybook.js.org/blog/how-to-document-your-design-system-best-practices-tools/',
    })
  })

  it('keeps the link when guid is not a permalink', () => {
    const [first] = parseFeed(dsc)
    expect(first.guid).toBe('https://medium.com/p/3267637d43c0')
    expect(first.link).toMatch(/^https:\/\/www\.designsystemscollective\.com\/component-kit-builder-dev-log-06/)
  })

  it('reads items with only a title, link and date', () => {
    const items = parseFeed(ahmadShadeed)
    expect(items[0]).toMatchObject({ title: 'Accessible Checkbox', link: 'https://ishadeed.com/article/accessible-checkbox/' })
    expect(items[0].summaryHtml).toBeUndefined()
  })

  it('reads Atom entries with updated dates and html content', () => {
    const [first] = parseFeed(bradFrost)
    expect(first).toMatchObject({
      title: expect.stringContaining('In Your Face'),
      link: 'https://bradfrost.com/links/post/in-your-face-meeting-reminder-app-for-mac-windows-iphone-and-ipad-in-your-face/',
      date: '2026-11-05T00:00:00Z',
      contentHtml: '<p>Full post body</p>',
    })
  })

  it('reads Kill the Newsletter Atom feeds', () => {
    const items = parseFeed(newsletter)
    expect(items.map((item) => item.title)).toEqual([
      'The Home Repo Pattern',
      'Three things I learned shipping agents this week',
      'Confirm your email',
    ])
    expect(items[0]).toMatchObject({
      guid: 'urn:kill-the-newsletter:entry-repeat',
      link: 'https://kill-the-newsletter.com/feeds/testfeed/entries/entry-repeat.html',
      date: '2026-11-13T09:00:00.000Z',
    })
    expect(items[0].contentHtml).toContain('<a href="https://www.aihero.dev/the-home-repo-pattern?utm_source=newsletter">')
  })

  it('prefers the alternate link in Atom', () => {
    const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>1</id><title>T</title>
      <link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/post"/></entry></feed>`
    expect(parseFeed(xml)[0].link).toBe('https://example.com/post')
  })

  it('throws on invalid XML and unknown formats', () => {
    expect(() => parseFeed('<rss><channel>')).toThrow('not valid XML')
    expect(() => parseFeed('<html><body>Not a feed</body></html>')).toThrow('Unsupported feed format')
  })
})
