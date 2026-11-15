import { useEffect } from 'react'
import styles from './App.module.css'
import { AlertsToggle } from './components/AlertsToggle.tsx'
import { Column } from './components/Column.tsx'
import { ColumnTiles } from './components/ColumnTiles.tsx'
import { EmptyColumn } from './components/EmptyColumn.tsx'
import { Header } from './components/Header.tsx'
import { SummaryBanner } from './components/SummaryBanner.tsx'
import { ThemeToggle } from './components/ThemeToggle.tsx'
import { columns, feeds } from './feeds/config.ts'
import { buildColumn } from './feeds/mix.ts'
import { markAllRead, markRead } from './feeds/readState.ts'
import { useFeedRefresh } from './lib/useFeedRefresh.ts'
import { useNow } from './lib/useNow.ts'
import { getStored, setStored, useStored } from './storage/storage.ts'

function App() {
  // Rendered straight from the cache; useFeedRefresh fetches after first paint.
  const cache = useStored('cache')
  const read = useStored('read')
  const now = useNow()
  const { refreshing, refresh } = useFeedRefresh()

  const views = columns.map((column) => buildColumn(column, cache, read))
  const totalNew = views.reduce((sum, view) => sum + view.newCount, 0)

  useEffect(() => {
    document.title = totalNew ? `(${totalNew}) Learning feed` : 'Learning feed'
  }, [totalNew])

  return (
    <div className={styles.page}>
      <Header
        now={now}
        checkedAt={cache.checkedAt}
        refreshing={refreshing}
        onRefresh={() => refresh()}
        onMarkAllRead={() => setStored('read', markAllRead(Date.now()))}
        actions={
          <>
            <ThemeToggle />
            <AlertsToggle />
          </>
        }
      />
      <section className={styles.summary} aria-label="New articles summary">
        <SummaryBanner total={totalNew} since={read.lastReadAt} />
        <ColumnTiles views={views} />
      </section>
      <main className={styles.columns}>
        {views.map((view) =>
          view.column.feeds.length === 0 ? (
            <EmptyColumn key={view.column.id} id={view.column.id} name={view.column.name} />
          ) : (
            <Column
              key={view.column.id}
              view={view}
              now={now}
              onOpen={(id) => setStored('read', markRead(getStored('read'), id))}
              onRetry={(feedId) => refresh(feeds.filter((feed) => feed.id === feedId))}
            />
          ),
        )}
      </main>
    </div>
  )
}

export default App
