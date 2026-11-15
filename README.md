# Learning feed

A personal start page that collects learning feeds into columns. It shows how many articles are new since you last caught up and alerts you when something new is published.

Built with Vite, React 19 (with the React Compiler) and TypeScript, and hosted on Vercel. The brief and design it was built from are in [`docs/`](docs/).

## How it works

- The page is a static Vite build. Each feed is fetched through one small Vercel Function, [`api/feed.ts`](api/feed.ts), because most of these feeds don't send CORS headers.
- The function only fetches feeds listed in [`src/feeds/config.ts`](src/feeds/config.ts), looked up by id, so it can't be used as an open proxy. The CDN caches each feed for 5 minutes.
- Feeds are parsed in the browser with `DOMParser`; both RSS 2.0 and Atom are supported. Feed content is rendered as plain text only, and only `http(s)` links are shown.
- The last results are saved in `localStorage`, so the page renders straight away and refreshes after first paint.

### What counts as new

- An item is **new** until you open it, or until you press **Mark all as read**.
- **Mark all as read** sets `lastReadAt` to now. Anything published before that counts as read.
- Opening the page never moves `lastReadAt`. On your first visit it starts 7 days back.

### Alerts

- While the page is open, even in a background tab, it re-checks every 30 minutes and whenever you return to the tab after a gap.
- The tab title shows the unread count, e.g. `(12) Learning feed`.
- If you allow notifications (the bell button), each check that finds new articles sends one notification while the tab is in the background.

### Why a website and not an extension

The brief suggested a browser extension. A plain website was chosen because it's simpler to run and works on any device. The trade-offs:

- Notifications only arrive while the page is open.
- There's no toolbar badge; the count is in the tab title instead.
- Chrome can't use a website as its new-tab page (that needs an extension), but it can open it on start-up.
- Read state is stored per browser and doesn't sync between devices.

## Feeds

Feeds and columns live in [`src/feeds/config.ts`](src/feeds/config.ts), with one line per feed. Optional rules per feed:

| Option | Effect |
|---|---|
| `maxItems` | Keep only the newest N items |
| `maxPerDay` | Keep at most N items per day, for very frequent feeds |
| `collapseTitleSuffix` | Hide items whose title ends with this, e.g. dictionary sub-entries |
| `titleSummarySeparator` | Split a long title: the text after this becomes the summary |
| `kind: 'newsletter'` | Email newsletter (Kill the Newsletter). Builds the summary from the email, adds an envelope icon, and hides issues that link to a post already in the column |

**Private feed URLs.** A Kill the Newsletter URL works like a password: anyone who has it can read those emails. Use `url: { env: 'NAME' }` in the config and set the real URL as an environment variable. It's only read by the function, so it never reaches this repo or the browser.

Adding a new **public** feed is a one-line change. Adding a **newsletter** also needs its env var set in Vercel and in `.env.local`.

## Local development

```sh
npm install
cp .env.example .env.local   # then paste in the two newsletter feed URLs
npm run dev                  # page + /api/feed on http://localhost:5173
```

`npm run dev` serves `/api/feed` with the same handler that Vercel deploys, so you don't need the Vercel CLI.

| Script | |
|---|---|
| `npm run dev` | Dev server with HMR and the feed proxy |
| `npm test` | Vitest: parsing, feed rules, mixing, read state, proxy, UI |
| `npm run typecheck` | `tsc -b` across the app, the function and the config |
| `npm run lint` | oxlint |
| `npm run build` | Type-check and build to `dist/` |

## Deploying (Vercel)

1. In Vercel, **Add New → Project** and import this repo. It detects Vite with no extra settings.
2. In **Settings → Environment Variables**, add `AIHERO_NEWSLETTER_FEED_URL` and `FRONTEND_MENTOR_NEWSLETTER_FEED_URL` for **Production** and **Preview**.
3. Pushes to `main` deploy to production. Other branches, such as `develop`, get preview URLs.

Security headers (a strict CSP, `noindex`) and long-term caching for hashed assets are set in [`vercel.json`](vercel.json).

## Making it your start page in Chrome

- **Settings → On start-up → Open a specific page or set of pages → Add a new page** and enter the production URL.
- Optional: **Settings → Appearance → Show Home button** with the same URL, and a bookmark on the bookmarks bar.
- Click the bell button on the page once to allow notifications.

## Project structure

```
api/feed.ts              Feed proxy (Vercel Function)
src/feeds/config.ts      Columns and feeds
src/feeds/parse.ts       RSS 2.0 + Atom → raw items
src/feeds/rules.ts       Raw items → display items, per-feed rules
src/feeds/mix.ts         Column view: mixing, sorting, de-duplication, new counts
src/feeds/refresh.ts     Fetch through the proxy and update the cache
src/storage/storage.ts   Typed localStorage with cross-tab sync
src/components/          UI
src/styles/tokens.css    Design tokens (light-dark()), fonts
```
