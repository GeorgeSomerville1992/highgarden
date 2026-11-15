import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyTheme } from '../lib/theme.ts'
import { getStored, subscribe } from '../storage/storage.ts'
import { ThemeToggle } from './ThemeToggle.tsx'

let unsubscribe = () => {}

beforeEach(() => {
  localStorage.clear()
  window.dispatchEvent(new StorageEvent('storage', { key: null }))
  unsubscribe = subscribe(() => applyTheme(getStored('theme')))
})

afterEach(() => {
  cleanup()
  unsubscribe()
  delete document.documentElement.dataset.theme
})

describe('ThemeToggle', () => {
  it('cycles system → light → dark → system and overrides the OS setting', () => {
    render(<ThemeToggle />)
    const button = () => screen.getByRole('button')

    expect(button().getAttribute('aria-label')).toBe('Theme: match system. Switch to light')
    expect(document.documentElement.dataset.theme).toBeUndefined()

    fireEvent.click(button())
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(button())
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('learning-feed:v1:theme')).toBe('"dark"')

    fireEvent.click(button())
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(button().getAttribute('aria-label')).toBe('Theme: match system. Switch to light')
  })
})
