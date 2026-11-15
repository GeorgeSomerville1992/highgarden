import type { ColumnView } from '../feeds/mix.ts'
import { accentStyle } from '../lib/accent.ts'
import styles from './ColumnTiles.module.css'

/** One tile per column, on the same grid as the columns so each lines up above its own. */
export function ColumnTiles({ views }: { views: ColumnView[] }) {
  return (
    <ul className={styles.tiles}>
      {views.map(({ column, newCount, breakdown }) =>
        column.feeds.length === 0 ? (
          <li key={column.id} className={styles.blank} aria-hidden="true" />
        ) : (
          <li key={column.id} className={styles.tile} style={accentStyle(column.accent)}>
            <div className={styles.top}>
              <p className={styles.name}>{column.name}</p>
              <span className={styles.dot} aria-hidden="true" />
            </div>
            <div className={styles.count}>
              <span className={styles.number}>{newCount}</span>
              <span className={styles.unit}>new</span>
            </div>
            <p className={styles.breakdown}>{breakdown}</p>
          </li>
        ),
      )}
    </ul>
  )
}
