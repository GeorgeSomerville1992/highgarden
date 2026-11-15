import { describe, expect, it } from 'vitest'
import { formatLongDate, formatRelative, formatShortDate, formatTime, greeting } from './dates.ts'

const now = new Date(2026, 10, 15, 8, 43)
const day = (month: number, date: number, year = 2026) => new Date(year, month, date, 12).getTime()

describe('dates', () => {
  it('formats the header and banner dates like the design', () => {
    expect(formatLongDate(now)).toBe('Sunday 15 November')
    expect(formatShortDate(day(10, 8))).toBe('Sun 8 Nov')
    expect(formatShortDate(day(8, 24))).toBe('Thu 24 Sep')
    expect(formatTime(now)).toBe('08:43')
  })

  it('greets by time of day', () => {
    expect(greeting(new Date(2026, 10, 15, 6))).toBe('Good morning')
    expect(greeting(new Date(2026, 10, 15, 12))).toBe('Good afternoon')
    expect(greeting(new Date(2026, 10, 15, 18))).toBe('Good evening')
  })

  it('shows relative dates for two weeks, then plain dates', () => {
    expect(formatRelative(day(10, 15), now)).toBe('Today · 15 Nov')
    expect(formatRelative(day(10, 14), now)).toBe('Yesterday · 14 Nov')
    expect(formatRelative(day(10, 12), now)).toBe('3 days ago · 12 Nov')
    expect(formatRelative(day(10, 6), now)).toBe('Last week · 6 Nov')
    expect(formatRelative(day(10, 1), now)).toBe('1 Nov')
    expect(formatRelative(day(2, 11, 2024), now)).toBe('11 Mar 2024')
  })

  it('treats future dates as today', () => {
    expect(formatRelative(day(10, 16), now)).toBe('Today · 16 Nov')
  })
})
