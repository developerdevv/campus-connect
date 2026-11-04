import { useCallback, useEffect, useRef, useState } from 'react'

/** Fetch data and discard results from older requests when dependencies change. */
export function useApi(fn, deps = [], { skip = false } = {}) {
  const [state, setState] = useState({ data: null, meta: null, loading: !skip, error: null })
  const [nonce, setNonce] = useState(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    // This flag belongs to this specific request, not to the hook as a whole.
    // That prevents a slow, older search from overwriting a newer search.
    let active = true
    if (skip) {
      setState({ data: null, meta: null, loading: false, error: null })
      return () => { active = false }
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    Promise.resolve()
      .then(() => fnRef.current())
      .then((res) => {
        if (active) setState({ data: res?.data ?? null, meta: res?.meta ?? null, loading: false, error: null })
      })
      .catch((err) => {
        if (active && err.name !== 'AbortError') {
          setState({ data: null, meta: null, loading: false, error: err })
        }
      })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip, nonce])

  const refetch = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((value) => {
    setState((s) => ({ ...s, data: typeof value === 'function' ? value(s.data) : value }))
  }, [])

  return { ...state, refetch, setData }
}
