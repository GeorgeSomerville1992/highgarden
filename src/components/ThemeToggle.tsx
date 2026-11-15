import { setStored, useStored, type Theme } from '../storage/storage.ts'
import buttons from './Button.module.css'

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const NAMES: Record<Theme, string> = { system: 'match system', light: 'light', dark: 'dark' }

export function ThemeToggle() {
  const theme = useStored('theme')
  const label = `Theme: ${NAMES[theme]}. Switch to ${NAMES[NEXT[theme]]}`
  return (
    <button
      type="button"
      className={`${buttons.button} ${buttons.icon}`}
      onClick={() => setStored('theme', NEXT[theme])}
      aria-label={label}
      title={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === 'system' && (
          <>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          </>
        )}
        {theme === 'light' && (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        )}
        {theme === 'dark' && <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />}
      </svg>
    </button>
  )
}
