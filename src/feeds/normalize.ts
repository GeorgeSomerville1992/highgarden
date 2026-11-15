// Feed content is untrusted: everything here produces plain text or a vetted http(s) URL.

const BLOCK_ELEMENTS = 'p, div, br, li, ul, ol, h1, h2, h3, h4, h5, h6, tr, td, th, table, section, article, blockquote, pre, hr'

/** The absolute URL if it's http(s), otherwise undefined. */
export function safeUrl(value: string | null | undefined, base?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value.trim(), base)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

/** Comparable form of a link: host without www, path without trailing slash, no query or hash. */
export function normalizeLink(value: string): string | undefined {
  const href = safeUrl(value)
  if (!href) return undefined
  const url = new URL(href)
  return url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/+$/, '')
}

/** Plain text from an HTML fragment: tags dropped, entities decoded, whitespace collapsed. */
export function toText(html: string): string {
  // DOMParser documents are inert: no scripts run and no resources load.
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const node of doc.querySelectorAll('script, style, title, head')) node.remove()
  for (const node of doc.querySelectorAll(BLOCK_ELEMENTS)) node.after(' ')
  return collapseWhitespace(doc.body?.textContent ?? '')
}

/** Decode entities in plain text without treating anything as markup ("The &lt;dialog&gt; element" stays intact). */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return collapseWhitespace(text)
  const doc = new DOMParser().parseFromString(text.replaceAll('<', '&lt;'), 'text/html')
  return collapseWhitespace(doc.body?.textContent ?? '')
}

/** Whitespace collapsed, and invisible characters (email preheader padding, soft hyphens) removed. */
export function collapseWhitespace(text: string): string {
  return text
    .replace(/\u034f|[\u00ad\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cut to about `max` characters on a word boundary, with an ellipsis. */
export function clampText(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max + 1)
  const lastSpace = cut.lastIndexOf(' ')
  const clipped = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : text.slice(0, max)
  return `${clipped.replace(/[\s,;:.–—-]+$/, '')}…`
}
