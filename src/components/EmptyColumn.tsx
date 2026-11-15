import styles from './EmptyColumn.module.css'

export function EmptyColumn({ id, name }: { id: string; name: string }) {
  const titleId = `column-${id}`
  return (
    <section className={styles.empty} aria-labelledby={titleId}>
      <svg className={styles.icon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
      <h2 id={titleId} className={styles.title}>
        {name}
      </h2>
      <p className={styles.text}>Space for your fourth set of feeds</p>
    </section>
  )
}
