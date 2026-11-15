const DAY_MS = 86_400_000

// Intl's en-GB short months give "Sept"; the design uses "Sep".
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const shortWeekday = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function greeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "Sunday 15 November" */
export function formatLongDate(date: Date | number): string {
  return longDate.format(date)
}

/** "Sun 8 Nov" */
export function formatShortDate(date: Date | number): string {
  const d = new Date(date)
  return `${shortWeekday.format(d)} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`
}

/** "08:43" */
export function formatTime(date: Date | number): string {
  return clock.format(date)
}

/** Local calendar date for `<time dateTime>`: "2026-11-15" */
export function toIsoDate(date: Date | number): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "3 days ago · 12 Nov", "Last week · 4 Nov", or a plain date once it's two weeks old. */
export function formatRelative(published: number, now: Date): string {
  const d = new Date(published)
  const days = calendarDaysBetween(d, now)
  const date = `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}${d.getFullYear() !== now.getFullYear() ? ` ${d.getFullYear()}` : ''}`
  const relative =
    days <= 0 ? 'Today'
    : days === 1 ? 'Yesterday'
    : days < 7 ? `${days} days ago`
    : days < 14 ? 'Last week'
    : null
  return relative ? `${relative} · ${date}` : date
}

function calendarDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((end - start) / DAY_MS)
}
