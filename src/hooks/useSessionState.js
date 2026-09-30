import { useCallback, useRef, useState } from 'react'

export default function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const saved = sessionStorage.getItem(`snackbox:${key}`); if (saved !== null) return JSON.parse(saved) } catch { /* Storage may be unavailable. */ }
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })
  const latest = useRef(value)
  const update = useCallback(next => {
    const resolved = typeof next === 'function' ? next(latest.current) : next
    latest.current = resolved
    // Save before navigation can unmount the current screen.
    try { sessionStorage.setItem(`snackbox:${key}`, JSON.stringify(resolved)) } catch { /* Continue without storage. */ }
    setValue(resolved)
  }, [key])
  return [value, update]
}
