import { useEffect, useState } from 'react'

/**
 * The value, but only after it has stopped changing for `delay` ms.
 *
 * The admin users table drove its query key straight off the search input, so
 * every keystroke was an HTTP request — and on the server every one of those
 * was a COUNT plus (before the N+1 fix) one query per row. Typing a five-letter
 * name cost five round trips and several hundred queries, and the results
 * raced: a slow response for "ris" could land after "rishi" and repaint the
 * table with the wrong rows.
 *
 * The input stays fully controlled and instant; only the QUERY waits.
 */
export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  return debounced
}

export default useDebounced
