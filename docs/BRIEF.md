> **Status (15 Nov 2026):** built as a hosted website on Vercel rather than the browser extension recommended below. See the README for what changed and why. The two Kill the Newsletter feed URLs are private and live in env vars, not in this repo.

# Brief: RSS learning start page

A personal start page that opens every time I open the browser (and on each new tab). It brings my learning feeds into one place, shows how many new articles have come out since I last caught up, and notifies me when something new is published.

I'm a senior frontend engineer (React, TypeScript). Build it the way I'd build it at work: typed, small, no unnecessary dependencies.

The approved visual design is in `design-reference.dc.html`, next to this file. It's an export from a design tool, so don't run it or copy its template syntax (`{{…}}`, `<sc-for>`, `<sc-if>`, `<x-dc>`). Use it as a reference for layout, spacing, colours, type and copy. The `renderVals()` script at the bottom also holds the real sample data and the date-sorting and "new" logic.

---

## 1. Recommended approach

**A browser extension that replaces the new tab page.** Manifest V3, built with Vite + React + TypeScript.

Why an extension rather than a normal web page:
- **CORS.** Most of these feeds don't send CORS headers, so a plain web page can't fetch them without a proxy server. An extension with `host_permissions` for the feed domains can fetch them directly.
- **Notifications.** `chrome.alarms` can check the feeds in the background (for example every 30 minutes), and `chrome.notifications` can tell me when something new arrives, even when the tab isn't open.
- **Opens automatically.** `chrome_url_overrides.newtab` shows the page on every new tab. I can also set the browser's startup page to it.

Assume Chrome/Chromium (it then also works in Edge, Brave and Arc). Keep the browser-specific parts behind a small wrapper so a Firefox build stays possible.

Suggested structure:
- `src/newtab/`: the React page
- `src/background/`: service worker (alarms, fetching, notifications, badge count)
- `src/feeds/`: feed config, fetching, RSS/Atom parsing, de-duplication
- `src/storage/`: typed wrapper over `chrome.storage.local`

Parse feeds with `DOMParser`. RSS 2.0 and Atom both need to work: the Kill the Newsletter feeds are Atom. Avoid a heavy feed library unless parsing becomes a real problem.

---

## 2. Layout (see the design reference)

From top to bottom, inside a container with a maximum width of 1440px:

1. **Header.** Date ("Sunday 15 November") above a greeting ("Good morning, George", which changes with the time of day). On the right: "Feeds checked HH:MM", a **Refresh** button and a **Mark all as read** button.
2. **Summary banner.** A full-width dark row with a big total count, the label "NEW SINCE LAST VISIT", and the text "new articles across your feeds since <date>". The last-visit date sits on the right.
3. **Column tiles.** One tile per column showing its name, a coloured dot, its new count, and which sources the new items came from (for example "Design Systems Collective 4"). The tiles use the same grid as the columns below, so each tile lines up above its column. The slot above an empty column is left blank.
4. **Columns.** Four columns in a responsive grid (`repeat(auto-fit, minmax(min(100%, 300px), 1fr))`, gap 24px). On a phone they stack into one column. Each column has:
   - A header with a short accent bar, the column name, an "N new" pill and a list of its sources
   - Items from all its feeds **mixed together and sorted by publish date, newest first**
   - A **NEW** badge on unread items, and an "Earlier" divider before the first read item
   - Each item shows: source name · relative date ("3 days ago · 12 Nov", or a plain date once it's more than two weeks old), the title linking to the article, and an optional one-line summary
   - An optional footnote at the bottom (used to say that a newsletter feed is connected but empty)
5. **Column 4** is empty for now: a dashed box with an "Add feeds" button.

### Design tokens

| Token | Light | Dark |
|---|---|---|
| Background | `#F4F3EF` | `#121212` |
| Surface (cards) | `#FFFFFF` | `#1C1C1C` |
| Sunk (dividers, footnotes) | `#FAF9F6` | `#171717` |
| Ink | `#1A1A18` | `#EDEDEA` |
| Muted text | `#5C5B56` | `#A6A5A0` |
| Lines | `#E4E2DB` | `#2E2E2C` |
| Text on accent | `#FFFFFF` | `#121212` |
| Accent: AI Engineering | `#5B3FD9` | `#B3A4FF` |
| Accent: React & Frontend | `#0A6A8A` | `#5CC8E0` |
| Accent: CSS & Design Systems | `#B13F0B` | `#FDA165` |

- **Fonts:** Inter for body text (15px, line height 1.5) and Space Grotesk for headings and numbers. Bundle both with the extension rather than loading them from Google Fonts, so the page renders instantly and works offline.
- **Shapes:** cards and the banner have 16px corners. Buttons are 44px tall with 10px corners.
- **Dark mode:** follow `prefers-color-scheme`, with a manual override.
- **Accessibility:** all colour pairs above pass 4.5:1. Keep real `<button>` and `<a>` elements, visible focus styles, and `<time datetime>` on dates.

---

## 3. How "new" works

- An item is **new** until I've read it. It counts as read once I click it, or once I press **Mark all as read**.
- **Mark all as read** saves `lastReadAt = now`. Anything published before `lastReadAt` counts as read. The banner's "since <date>" and "Last visit" show `lastReadAt`.
- Don't move `lastReadAt` on every page load, or the count would reset each time I open a new tab.
- Also keep a set of clicked item IDs, so one article I've opened stops being new without clearing everything else.
- The background worker shows the total new count as the extension's **badge** and sends a **notification** when a check finds items it hasn't seen before. One notification per check, for example "3 new: This Week In React #306, …". Clicking it opens the start page.
- Item ID: the feed's `guid` or `id`, falling back to the link.

---

## 4. Feeds

### Column 1: AI Engineering (accent: purple)
| Source | Feed | Notes |
|---|---|---|
| AI Hero | https://www.aihero.dev/rss.xml | Every "AI Coding Dictionary" sub-entry comes through as its own item, all with the same timestamp. Collapse items titled `X \| AI Coding Dictionary` into the parent "AI Coding Dictionary" item. |
| AI Hero newsletter | `$AIHERO_NEWSLETTER_FEED_URL` (env var, kept out of the repo) | Newsletter turned into a feed with Kill the Newsletter (Atom). It may repeat posts from the site feed: if an email links to a URL that's already in the column, hide the email item. |
| AI Engineering Podcast | https://www.aiengineeringpodcast.com/ | This is the site, not a feed. Find its RSS feed (podcasts always have one; check the page `<head>` or Apple/Spotify listings). |

### Column 2: React & Frontend (accent: blue)
| Source | Feed | Notes |
|---|---|---|
| This Week In React | https://thisweekinreact.com/newsletter/rss.xml | Large feed (~450 KB). Only keep the latest items. |
| React Blog | https://react.dev/rss.xml | Posts rarely, so this is mostly older items. |
| Storybook | https://storybook.js.org/blog | This is the blog page, not a feed. Find the real feed URL. |
| Frontend Mentor newsletter | `$FRONTEND_MENTOR_NEWSLETTER_FEED_URL` (env var, kept out of the repo) | Kill the Newsletter feed. Empty until Gmail forwarding is set up. Show the column footnote while it has no entries. |

### Column 3: CSS & Design Systems (accent: orange)
| Source | Feed | Notes |
|---|---|---|
| Brad Frost | https://bradfrost.com/feed/ | |
| EightShapes | https://medium.com/feed/eightshapes-llc | No new post since March 2024. Keep it for now. |
| Design Systems Collective | https://www.designsystemscollective.com/feed | Posts several times a day, so it dominates the column. Consider capping it at a few items per day. |
| Ahmad Shadeed | https://ishadeed.com/feed.xml | Titles and dates only, no summaries. |

### Column 4
To be decided. Show the empty "Add feeds" state.

Keep the feed list in one typed config file (`src/feeds/config.ts`) so adding a feed or a column is a one-line change.

---

## 5. Details that matter

- **Newsletter items.** Use the email subject as the title. Make a short summary from the plain-text body (strip HTML, collapse whitespace, cut at about 140 characters), or leave the summary out if it comes out messy. Show a small envelope icon next to the source name so email issues stand out from blog posts.
- **Summaries.** Strip HTML from feed descriptions and limit them to one or two lines.
- **Per-column limit.** Show about the 12 most recent items per column, with a "Show more" link.
- **Caching.** Save the last fetched results in storage so the page renders instantly from cache, then refresh in the background. Show "Feeds checked HH:MM" from the last successful fetch.
- **Errors.** If a feed fails, show a quiet line in its column ("Storybook couldn't be reached · retry") and keep showing the cached items.
- **Security.** Feed content is untrusted. Never inject feed HTML. Render text only, and only allow `http`/`https` links.
- **Performance.** The new tab page must feel instant: no blocking network calls before the first paint.

---

## 6. Suggested order of work

1. Scaffold the extension (Vite, React, TS, MV3) and get a static new tab page matching the design, using the sample data in `design-reference.dc.html`.
2. Feed config, fetching and parsing (RSS + Atom), with tests against saved sample feeds.
3. Mixing, sorting and de-duplication rules (the AI Coding Dictionary collapse, newsletter vs site duplicates).
4. Read/unread state, the summary banner and the tiles.
5. Background worker: alarm, badge count, notifications.
6. Dark mode, error states, caching.
7. Find the missing feed URLs (the podcast and Storybook).

Ask me before adding anything beyond this brief.
