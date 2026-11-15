import { formatLongDate, formatShortDate, toIsoDate } from '../lib/dates.ts'
import styles from './SummaryBanner.module.css'

type SummaryBannerProps = {
  total: number
  /** lastReadAt */
  since: number
}

export function SummaryBanner({ total, since }: SummaryBannerProps) {
  return (
    <div className={styles.banner}>
      <div className={styles.count}>
        <span className={styles.number}>{total}</span>
        <div className={styles.text}>
          <p className={styles.label}>New since last visit</p>
          <p className={styles.description}>
            new {total === 1 ? 'article' : 'articles'} across your feeds since{' '}
            <time dateTime={toIsoDate(since)}>{formatShortDate(since)}</time>
          </p>
        </div>
      </div>
      <p className={styles.lastVisit}>
        Last visit: <time dateTime={toIsoDate(since)}>{formatLongDate(since)}</time>
      </p>
    </div>
  )
}
