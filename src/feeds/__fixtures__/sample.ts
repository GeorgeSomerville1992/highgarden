import type { FeedCache, FeedItem, ReadState } from '../types.ts'

// The sample data from docs/design-reference.dc.html, as a cache.

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

type SampleItem = [feedId: string, date: string, title: string, url: string, summary?: string]

const items: SampleItem[] = [
  ['aihero', '2026-11-12', 'The Home Repo Pattern', 'https://www.aihero.dev/the-home-repo-pattern'],
  ['aihero', '2026-11-12', 'AI Coding Dictionary', 'https://www.aihero.dev/ai-coding-dictionary', 'A new glossary of AI coding terms, from model to parameters.'],
  ['aihero', '2026-11-06', 'AI SDK v6 Crash Course', 'https://www.aihero.dev/'],
  ['ai-engineering-podcast', '2026-10-15', 'What Do Humans Do Now? Rethinking Software Engineering in the Age of AI Agents', 'https://www.aiengineeringpodcast.com/episodepage/what-do-humans-do-now-rethinking-software-engineering-in-the-age-of-ai-agents', 'E81 · Jonathan Ellis on how agents change the economics of software development.'],
  ['ai-engineering-podcast', '2026-10-07', 'How to Evaluate RAG Systems When Ground Truth Keeps Changing', 'https://www.aiengineeringpodcast.com/episodepage/how-to-evaluate-rag-systems-when-ground-truth-keeps-changing', 'E80 · Evaluating production RAG when source data is incomplete or shifting.'],
  ['ai-engineering-podcast', '2026-09-19', 'Harness Engineering for Reliable, Governed AI Agents', 'https://www.aiengineeringpodcast.com/episodepage/harness-engineering-for-reliable-governed-ai-agents', 'E79 · Memory, tools and sandboxed execution as the agent harness.'],
  ['twir', '2026-11-11', 'This Week In React #305', 'https://thisweekinreact.com/newsletter/305', "X's rebuilt app on streaming SSR and Relay, Discord moves off React Native, Expo previews Exact."],
  ['twir', '2026-11-04', 'This Week In React #304', 'https://thisweekinreact.com/newsletter/304', 'React Native 0.89 RC, Vega OS 2.0, and pull_request_target restricted by default.'],
  ['react-blog', '2026-09-09', 'React 19.3', 'https://react.dev/blog/2026/09/09/react-19-3', 'View Transitions, Fragment Refs, Trusted Types support and more.'],
  ['storybook', '2026-08-31', 'How to document your design system: best practices & tools', 'https://storybook.js.org/blog/how-to-document-your-design-system-best-practices-tools/'],
  ['storybook', '2026-08-31', 'Component testing: a practical guide for frontend developers', 'https://storybook.js.org/blog/component-testing-a-practical-guide-for-frontend-developers/'],
  ['storybook', '2026-06-16', 'Storybook for TanStack React', 'https://storybook.js.org/blog/storybook-for-tanstack-react/', 'First-class support for TanStack Router, Start and Query.'],
  ['dsc', '2026-11-13', 'Component Kit Builder Dev Log #06', 'https://www.designsystemscollective.com/component-kit-builder-dev-log-06-3267637d43c0'],
  ['dsc', '2026-11-13', 'Localisation is a design-system problem', 'https://www.designsystemscollective.com/localisation-is-a-design-system-problem-1d0a922d007d'],
  ['dsc', '2026-11-13', '“No results.” Or just the wrong search?', 'https://www.designsystemscollective.com/no-results-or-just-the-wrong-search-the-ux-bit-169ef02513ec'],
  ['dsc', '2026-11-12', 'Three widths, two identical screenshots', 'https://www.designsystemscollective.com/three-widths-two-identical-screenshots-c4e09238bf3b'],
  ['ahmad-shadeed', '2026-11-05', 'Beyond the viewport: Introducing Site Seeing', 'https://ishadeed.com/article/beyond-the-viewport/'],
  ['brad-frost', '2026-11-05', 'In Your Face: meeting reminder app', 'https://bradfrost.com/links/post/in-your-face-meeting-reminder-app-for-mac-windows-iphone-and-ipad-in-your-face/'],
  ['brad-frost', '2026-10-28', 'Playing My World: Helsinki Cathedral', 'https://bradfrost.com/blog/post/playing-my-world-helsinki-cathedral/'],
  ['ahmad-shadeed', '2026-10-15', 'Fit height to background pattern size with calc-size()', 'https://ishadeed.com/article/fit-height-background-pattern-calc-size/'],
  ['ahmad-shadeed', '2026-09-24', 'Detect when elements overlap with CSS', 'https://ishadeed.com/article/css-detect-overlap/'],
  ['eightshapes', '2024-03-11', 'Adopting Design System Generations', 'https://medium.com/eightshapes-llc/adopting-design-system-generations-900535442a16', 'Nathan Curtis'],
]

export const sampleNow = new Date(2026, 10, 15, 8, 43)

export const sampleRead: ReadState = { lastReadAt: day('2026-11-08'), readIds: [] }

const checkedAt = sampleNow.getTime()

const byFeed = new Map<string, FeedItem[]>()
for (const [feedId, date, title, url, summary] of items) {
  const list = byFeed.get(feedId) ?? []
  list.push({ id: `${feedId}:${url}#${title}`, feedId, title, url, publishedAt: day(date), summary })
  byFeed.set(feedId, list)
}

export const sampleCache: FeedCache = {
  checkedAt,
  feeds: {
    ...Object.fromEntries([...byFeed].map(([feedId, feedItems]) => [feedId, { items: feedItems, fetchedAt: checkedAt }])),
    'aihero-newsletter': { items: [], fetchedAt: checkedAt },
    'frontend-mentor-newsletter': { items: [], fetchedAt: checkedAt },
  },
}
