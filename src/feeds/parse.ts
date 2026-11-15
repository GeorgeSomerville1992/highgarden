// RSS 2.0 and Atom → a flat list of raw items. No interpretation here beyond reading fields:
// rules.ts turns these into display-ready FeedItems.

const ATOM_NS = 'http://www.w3.org/2005/Atom'
const CONTENT_NS = 'http://purl.org/rss/1.0/modules/content/'
const DC_NS = 'http://purl.org/dc/elements/1.1/'

export type RawItem = {
  /** guid (RSS) or id (Atom) */
  guid?: string
  title: string
  /** Whether `title` is HTML (Atom type="html") rather than plain text. */
  titleIsHtml: boolean
  link?: string
  /** pubDate / dc:date / published / updated, unparsed */
  date?: string
  /** description (RSS) or summary (Atom), HTML */
  summaryHtml?: string
  /** content:encoded (RSS) or content (Atom), HTML */
  contentHtml?: string
}

export function parseFeed(xml: string): RawItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Feed is not valid XML')

  const root = doc.documentElement
  if (root.localName === 'feed' && root.namespaceURI === ATOM_NS) return parseAtom(root)
  if (root.localName === 'rss') return parseRss(root)
  throw new Error(`Unsupported feed format <${root.localName}>`)
}

function parseRss(root: Element): RawItem[] {
  const channel = child(root, 'channel', null)
  if (!channel) return []
  return children(channel, 'item', null).map((item) => {
    const guid = child(item, 'guid', null)
    const guidText = text(guid)
    const isPermaLink = guid?.getAttribute('isPermaLink') !== 'false'
    return {
      guid: guidText,
      title: text(child(item, 'title', null)) ?? '',
      titleIsHtml: false,
      link: text(child(item, 'link', null)) ?? (isPermaLink ? guidText : undefined),
      date: text(child(item, 'pubDate', null)) ?? text(child(item, 'date', DC_NS)),
      summaryHtml: text(child(item, 'description', null)),
      contentHtml: text(child(item, 'encoded', CONTENT_NS)),
    }
  })
}

function parseAtom(root: Element): RawItem[] {
  return children(root, 'entry', ATOM_NS).map((entry) => {
    const title = child(entry, 'title', ATOM_NS)
    return {
      guid: text(child(entry, 'id', ATOM_NS)),
      title: text(title) ?? '',
      titleIsHtml: title?.getAttribute('type') === 'html',
      link: atomLink(entry),
      date: text(child(entry, 'published', ATOM_NS)) ?? text(child(entry, 'updated', ATOM_NS)),
      summaryHtml: atomText(child(entry, 'summary', ATOM_NS)),
      contentHtml: atomText(child(entry, 'content', ATOM_NS)),
    }
  })
}

/** The entry's web page: rel="alternate", or a link with no rel. */
function atomLink(entry: Element): string | undefined {
  const links = children(entry, 'link', ATOM_NS)
  const alternate = links.find((link) => (link.getAttribute('rel') ?? 'alternate') === 'alternate')
  return alternate?.getAttribute('href')?.trim() || undefined
}

/** Atom text constructs: type="xhtml" holds markup as child elements, the others hold text. */
function atomText(el: Element | undefined): string | undefined {
  if (!el) return undefined
  if (el.getAttribute('type') === 'xhtml') return el.innerHTML.trim() || undefined
  return text(el)
}

function children(parent: Element, localName: string, ns: string | null): Element[] {
  return Array.from(parent.children).filter((el) => el.localName === localName && el.namespaceURI === ns)
}

function child(parent: Element, localName: string, ns: string | null): Element | undefined {
  return children(parent, localName, ns)[0]
}

function text(el: Element | undefined): string | undefined {
  return el?.textContent?.trim() || undefined
}
