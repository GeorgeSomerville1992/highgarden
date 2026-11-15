import type { ItemView } from '../feeds/mix.ts'
import { formatRelative } from '../lib/dates.ts'
import styles from './FeedItemRow.module.css'

type FeedItemRowProps = {
  item: ItemView
  now: Date
  onOpen: (id: string) => void
}

export function FeedItemRow({ item, now, onOpen }: FeedItemRowProps) {
  return (
    <li>
      {item.divider && <div className={styles.divider}>Earlier</div>}
      <article className={styles.item}>
        <div className={styles.meta}>
          <span className={styles.lead}>
            {item.isNew && <span className={styles.badge}>NEW</span>}
            <span className={styles.source}>
              {item.isNewsletter && <EnvelopeIcon />}
              {item.source}
            </span>
          </span>
          <time className={styles.when} dateTime={new Date(item.publishedAt).toISOString()}>
            {formatRelative(item.publishedAt, now)}
          </time>
        </div>
        <h3 className={styles.title}>
          <a
            href={item.url}
            onClick={() => onOpen(item.id)}
            onAuxClick={(event) => {
              if (event.button === 1) onOpen(item.id)
            }}
          >
            {item.title}
          </a>
        </h3>
        {item.summary && <p className={styles.summary}>{item.summary}</p>}
      </article>
    </li>
  )
}

function EnvelopeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}
