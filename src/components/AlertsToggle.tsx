import { useState } from 'react'
import { notificationPermission, requestNotificationPermission } from '../lib/notify.ts'
import buttons from './Button.module.css'

/** Asks for notification permission. Hidden once you've answered (or if the browser can't notify). */
export function AlertsToggle() {
  const [permission, setPermission] = useState(notificationPermission)
  if (permission !== 'default') return null

  const label = 'Turn on alerts for new articles'
  return (
    <button
      type="button"
      className={`${buttons.button} ${buttons.icon}`}
      onClick={async () => setPermission(await requestNotificationPermission())}
      aria-label={label}
      title={label}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </button>
  )
}
