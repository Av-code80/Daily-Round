'use client'

import { useEffect, useState } from 'react'

/**
Never use it for a local computation — it only adds perceived
 * latency for savings that do not exist.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    // Cleanup runs before every re-run and on unmount: each keystroke
    // cancels the pending timer, so only the last one ever fires.
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}