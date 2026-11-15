import type { ReactNode } from 'react'
import { ownerName } from '../feeds/config.ts'
import { formatLongDate, formatTime, greeting, toIsoDate } from '../lib/dates.ts'
import buttons from './Button.module.css'
import styles from './Header.module.css'

type HeaderProps = {
  now: Date
  checkedAt?: number
  refreshing: boolean
  onRefresh: () => void
  onMarkAllRead: () => void
  /** Extra icon buttons shown before Refresh. */
  actions?: ReactNode
}

export function Header({ now, checkedAt, refreshing, onRefresh, onMarkAllRead, actions }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <p className={styles.date}>
          <time dateTime={toIsoDate(now)}>{formatLongDate(now)}</time>
        </p>
        <h1 className={styles.greeting}>
          {greeting(now)}, {ownerName}
        </h1>
      </div>
      <div className={styles.actions}>
        {checkedAt !== undefined && (
          <span className={styles.checked}>
            Feeds checked <time dateTime={new Date(checkedAt).toISOString()}>{formatTime(checkedAt)}</time>
          </span>
        )}
        {actions}
        <button type="button" className={buttons.button} onClick={onRefresh} disabled={refreshing} aria-busy={refreshing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
        <button type="button" className={`${buttons.button} ${buttons.primary}`} onClick={onMarkAllRead}>
          Mark all as read
        </button>
      </div>
    </header>
  )
}
