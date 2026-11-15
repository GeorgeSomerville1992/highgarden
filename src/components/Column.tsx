import { useState } from 'react'
import type { ColumnView } from '../feeds/mix.ts'
import { accentStyle } from '../lib/accent.ts'
import styles from './Column.module.css'
import { FeedItemRow } from './FeedItemRow.tsx'

const VISIBLE_ITEMS = 12

/** "Storybook", "Storybook and React Blog", "A, B and C" */
const names = new Intl.ListFormat('en-GB', { type: 'conjunction' })

type ColumnProps = {
  view: ColumnView
  now: Date
  onOpen: (id: string) => void
  onRetry: (feedIds: string[]) => void
}

export function Column({ view, now, onOpen, onRetry }: ColumnProps) {
  const [expanded, setExpanded] = useState(false)
  const { column, items, newCount, sources, footnote, failedFeeds } = view
  const titleId = `column-${column.id}`
  const visible = expanded ? items : items.slice(0, VISIBLE_ITEMS)

  return (
    <section className={styles.column} aria-labelledby={titleId} style={accentStyle(column.accent)}>
      <div className={styles.header}>
        <div className={styles.bar} aria-hidden="true" />
        <div className={styles.titleRow}>
          <h2 id={titleId} className={styles.title}>
            {column.name}
          </h2>
          <span className={styles.pill}>{newCount} new</span>
        </div>
        <p className={styles.sources}>{sources}</p>
      </div>

      {failedFeeds.length > 0 && (
        <p className={styles.notice} role="status">
          {names.format(failedFeeds.map((feed) => feed.name))} couldn’t be reached ·{' '}
          <button type="button" className={styles.linkButton} onClick={() => onRetry(failedFeeds.map((feed) => feed.id))}>
            retry
          </button>
        </p>
      )}

      <ol className={styles.list}>
        {visible.map((item) => (
          <FeedItemRow key={item.id} item={item} now={now} onOpen={onOpen} />
        ))}
      </ol>

      {items.length > VISIBLE_ITEMS && (
        <button type="button" className={styles.more} onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          {expanded ? 'Show fewer' : `Show more (${items.length - VISIBLE_ITEMS})`}
        </button>
      )}

      {footnote && <p className={styles.footnote}>{footnote}</p>}
    </section>
  )
}
