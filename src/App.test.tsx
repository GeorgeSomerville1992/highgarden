import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { sampleCache, sampleRead } from './feeds/__fixtures__/sample.ts'

function seedStorage() {
  localStorage.clear()
  localStorage.setItem('learning-feed:v1:cache', JSON.stringify(sampleCache))
  localStorage.setItem('learning-feed:v1:read', JSON.stringify(sampleRead))
  // Make the storage module drop anything it read in an earlier test.
  window.dispatchEvent(new StorageEvent('storage', { key: null }))
}

function column(name: string) {
  return screen.getByRole('region', { name })
}

beforeEach(() => {
  seedStorage()
  // Keep the sample data on screen: the background refresh never completes.
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  // jsdom can't navigate; stop link clicks from trying.
  document.addEventListener('click', preventNavigation)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.removeEventListener('click', preventNavigation)
})

function preventNavigation(event: MouseEvent) {
  event.preventDefault()
}

describe('App', () => {
  it('renders from the cache before any fetch completes', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Good (morning|afternoon|evening), George$/)
    expect(screen.getByText('New since last visit').closest('div')?.parentElement?.textContent).toMatch(/^7/)
    expect(within(column('AI Engineering')).getByText('2 new')).toBeDefined()
    expect(within(column('CSS & Design Systems')).getByText('4 new')).toBeDefined()
    expect(screen.getByText('Space for your fourth set of feeds')).toBeDefined()
    expect(document.title).toBe('(7) Learning feed')
  })

  it('marks a single item as read when it is opened', () => {
    render(<App />)
    const ai = column('AI Engineering')
    fireEvent.click(within(ai).getByRole('link', { name: 'The Home Repo Pattern' }))

    expect(within(ai).getByText('1 new')).toBeDefined()
    expect(within(ai).getAllByText('NEW')).toHaveLength(1)
    expect(document.title).toBe('(6) Learning feed')
  })

  it('clears every new item with Mark all as read', () => {
    render(<App />)
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' })))

    expect(screen.queryAllByText('NEW')).toHaveLength(0)
    expect(document.title).toBe('Learning feed')
    const stored = JSON.parse(localStorage.getItem('learning-feed:v1:read') ?? '{}')
    expect(stored.lastReadAt).toBeGreaterThan(sampleRead.lastReadAt)
  })

  it('shows one quiet retry line per column for feeds that failed', () => {
    const failing = structuredClone(sampleCache)
    failing.feeds.storybook.error = 'Upstream responded 503'
    failing.feeds['react-blog'].error = 'Failed to fetch'
    localStorage.setItem('learning-feed:v1:cache', JSON.stringify(failing))
    window.dispatchEvent(new StorageEvent('storage', { key: null }))

    render(<App />)
    const react = column('React & Frontend')
    expect(within(react).getByText(/^React Blog and Storybook couldn’t be reached/)).toBeDefined()
    expect(within(react).getByRole('link', { name: 'Storybook for TanStack React' })).toBeDefined()
    expect(within(react).getByRole('button', { name: 'retry' })).toBeDefined()
  })
})
