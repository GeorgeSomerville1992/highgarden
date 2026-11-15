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
  doc.querySelectorAll('script, style, title, head').forEach((node) => node.remove())
  doc.querySelectorAll(BLOCK_ELEMENTS).forEach((node) => node.after(' '))
  return collapseWhitespace(doc.body?.textContent ?? '')
}

export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

/** Cut to about `max` characters on a word boundary, with an ellipsis. */
export function clampText(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max + 1)
  const lastSpace = cut.lastIndexOf(' ')
  const clipped = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : text.slice(0, max)
  return clipped.replace(/[\s,;:.–—-]+$/, '') + '…'
}
