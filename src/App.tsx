import styles from './App.module.css'
import { Column } from './components/Column.tsx'
import { ColumnTiles } from './components/ColumnTiles.tsx'
import { EmptyColumn } from './components/EmptyColumn.tsx'
import { Header } from './components/Header.tsx'
import { SummaryBanner } from './components/SummaryBanner.tsx'
import { sampleCache, sampleNow, sampleRead } from './feeds/__fixtures__/sample.ts'
import { columns } from './feeds/config.ts'
import { buildColumn } from './feeds/mix.ts'

// Static page from the design's sample data; live feeds and read state come next.
function App() {
  const now = sampleNow
  const views = columns.map((column) => buildColumn(column, sampleCache, sampleRead))
  const totalNew = views.reduce((sum, view) => sum + view.newCount, 0)

  return (
    <div className={styles.page}>
      <Header now={now} checkedAt={sampleCache.checkedAt} refreshing={false} onRefresh={() => {}} onMarkAllRead={() => {}} />
      <section className={styles.summary} aria-label="New articles summary">
        <SummaryBanner total={totalNew} since={sampleRead.lastReadAt} />
        <ColumnTiles views={views} />
      </section>
      <main className={styles.columns}>
        {views.map((view) =>
          view.column.feeds.length === 0 ? (
            <EmptyColumn key={view.column.id} id={view.column.id} name={view.column.name} />
          ) : (
            <Column key={view.column.id} view={view} now={now} onOpen={() => {}} onRetry={() => {}} />
          ),
        )}
      </main>
    </div>
  )
}

export default App
