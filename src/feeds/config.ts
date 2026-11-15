import type { ColumnConfig, FeedConfig } from './types.ts'

// Imported by both the page and api/feed.ts, so keep this file free of runtime imports.

export const ownerName = 'George'

export const columns: ColumnConfig[] = [
  {
    id: 'ai',
    name: 'AI Engineering',
    accent: { light: '#5B3FD9', dark: '#B3A4FF' },
    feeds: [
      { id: 'aihero', name: 'AI Hero', url: 'https://www.aihero.dev/rss.xml', collapseTitleSuffix: ' | AI Coding Dictionary' },
      { id: 'aihero-newsletter', name: 'AI Hero newsletter', kind: 'newsletter', url: { env: 'AIHERO_NEWSLETTER_FEED_URL' } },
      { id: 'ai-engineering-podcast', name: 'AI Engineering Podcast', url: 'https://serve.podhome.fm/rss/c9abdd38-a5dc-5eb2-96fd-f833f93208a7' },
    ],
  },
  {
    id: 'react',
    name: 'React & Frontend',
    accent: { light: '#0A6A8A', dark: '#5CC8E0' },
    feeds: [
      { id: 'twir', name: 'This Week In React', url: 'https://thisweekinreact.com/newsletter/rss.xml', maxItems: 10 },
      { id: 'react-blog', name: 'React Blog', url: 'https://react.dev/rss.xml' },
      { id: 'storybook', name: 'Storybook', url: 'https://storybook.js.org/blog/rss/' },
      { id: 'frontend-mentor-newsletter', name: 'Frontend Mentor newsletter', kind: 'newsletter', url: { env: 'FRONTEND_MENTOR_NEWSLETTER_FEED_URL' } },
    ],
  },
  {
    id: 'css',
    name: 'CSS & Design Systems',
    accent: { light: '#B13F0B', dark: '#FDA165' },
    feeds: [
      { id: 'brad-frost', name: 'Brad Frost', url: 'https://bradfrost.com/feed/feed.xml' },
      { id: 'eightshapes', name: 'EightShapes', url: 'https://medium.com/feed/eightshapes-llc' },
      { id: 'dsc', name: 'Design Systems Collective', url: 'https://www.designsystemscollective.com/feed', maxPerDay: 3 },
      { id: 'ahmad-shadeed', name: 'Ahmad Shadeed', url: 'https://ishadeed.com/feed.xml' },
    ],
  },
  {
    id: 'column-4',
    name: 'Column 4',
    accent: { light: '#5C5B56', dark: '#A6A5A0' },
    feeds: [],
  },
]

export const feeds: FeedConfig[] = columns.flatMap((column) => column.feeds)

export function findFeed(id: string): FeedConfig | undefined {
  return feeds.find((feed) => feed.id === id)
}
