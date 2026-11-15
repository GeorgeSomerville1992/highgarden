const MAX_TITLES = 3

export type AlertPermission = NotificationPermission | 'unsupported'

export function notificationPermission(): AlertPermission {
  return 'Notification' in window ? Notification.permission : 'unsupported'
}

export async function requestNotificationPermission(): Promise<AlertPermission> {
  return 'Notification' in window ? Notification.requestPermission() : 'unsupported'
}

/** One notification per check, and only while the page is in the background. */
export function notifyNewItems(items: { title: string }[]): void {
  if (!items.length || notificationPermission() !== 'granted' || document.visibilityState === 'visible') return
  const titles = items.slice(0, MAX_TITLES).map((item) => item.title).join(', ')
  const body = `${items.length} new: ${titles}${items.length > MAX_TITLES ? ', …' : ''}`
  // Same tag: a newer check replaces an unread notification rather than stacking up.
  const notification = new Notification('Learning feed', { body, tag: 'learning-feed' })
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}
