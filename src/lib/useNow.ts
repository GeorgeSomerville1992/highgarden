import { useEffect, useState } from 'react'

/** The current time, updated every minute, for the greeting and relative dates on a long-open tab. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])
  return now
}
