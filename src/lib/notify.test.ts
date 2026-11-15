import { afterEach, describe, expect, it, vi } from 'vitest'
import { notifyNewItems } from './notify.ts'

const created: { title: string; options?: NotificationOptions }[] = []

function stubNotifications(permission: NotificationPermission, visibility: DocumentVisibilityState) {
  created.length = 0
  vi.stubGlobal(
    'Notification',
    class {
      static permission = permission
      onclick: (() => void) | null = null
      constructor(title: string, options?: NotificationOptions) {
        created.push({ title, options })
      }
      close() {}
    },
  )
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility)
}

const items = (...titles: string[]) => titles.map((title) => ({ title }))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('notifyNewItems', () => {
  it('sends one notification listing the first few titles', () => {
    stubNotifications('granted', 'hidden')
    notifyNewItems(items('This Week In React #306', 'React 19.4', 'Storybook 11', 'Laser Storm'))
    expect(created).toEqual([
      { title: 'Learning feed', options: { body: '4 new: This Week In React #306, React 19.4, Storybook 11, …', tag: 'learning-feed' } },
    ])
  })

  it('stays quiet while the page is visible, without permission, or with nothing new', () => {
    stubNotifications('granted', 'visible')
    notifyNewItems(items('A'))
    stubNotifications('default', 'hidden')
    notifyNewItems(items('A'))
    stubNotifications('granted', 'hidden')
    notifyNewItems([])
    expect(created).toEqual([])
  })
})
