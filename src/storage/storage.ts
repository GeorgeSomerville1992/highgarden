import { useSyncExternalStore } from 'react'
import type { FeedCache, ReadState } from '../feeds/types.ts'

// Typed, versioned localStorage. Values are kept in memory too, so reads are synchronous
// (the first render can use the cache) and snapshots are stable for useSyncExternalStore.

const PREFIX = 'learning-feed:v1:'
const DAY_MS = 86_400_000

export type Theme = 'system' | 'light' | 'dark'

type Schema = {
  cache: FeedCache
  read: ReadState
  theme: Theme
}

type Key = keyof Schema

const defaults: { [K in Key]: () => Schema[K] } = {
  cache: () => ({ feeds: {} }),
  // First run: show the past week as new. Persisted straight away so the baseline doesn't move.
  read: () => ({ lastReadAt: Date.now() - 7 * DAY_MS, readIds: [] }),
  theme: () => 'system',
}

const valid: { [K in Key]: (value: unknown) => value is Schema[K] } = {
  cache: (value): value is FeedCache => isObject(value) && isObject(value.feeds),
  read: (value): value is ReadState =>
    isObject(value) && typeof value.lastReadAt === 'number' && Array.isArray(value.readIds),
  theme: (value): value is Theme => value === 'system' || value === 'light' || value === 'dark',
}

const memory = new Map<Key, unknown>()
const listeners = new Set<() => void>()

export function getStored<K extends Key>(key: K): Schema[K] {
  if (!memory.has(key)) memory.set(key, load(key))
  return memory.get(key) as Schema[K]
}

export function setStored<K extends Key>(key: K, value: Schema[K]): void {
  memory.set(key, value)
  persist(key, value)
  emit()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Re-renders when the value changes in this tab or another one. */
export function useStored<K extends Key>(key: K): Schema[K] {
  return useSyncExternalStore(subscribe, () => getStored(key))
}

function load<K extends Key>(key: K): Schema[K] {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw !== null) {
      const value: unknown = JSON.parse(raw)
      if (valid[key](value)) return value
    }
  } catch {
    // Unavailable or corrupt storage: fall back to the default.
  }
  const value = defaults[key]()
  persist(key, value)
  return value
}

function persist<K extends Key>(key: K, value: Schema[K]) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Private mode or quota: keep working from memory for this session.
  }
}

function emit() {
  for (const listener of listeners) listener()
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Another tab changed something: drop our copy so the next read picks it up.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null) memory.clear()
    else if (event.key.startsWith(PREFIX)) memory.delete(event.key.slice(PREFIX.length) as Key)
    else return
    emit()
  })
}
