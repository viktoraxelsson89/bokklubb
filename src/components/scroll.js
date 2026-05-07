import { useEffect } from 'react'

function getMainScroll() {
  if (typeof document === 'undefined') return null
  return document.getElementById('main-scroll')
}

export function saveMainScrollPosition(key) {
  const el = getMainScroll()
  if (!el) return
  sessionStorage.setItem(key, String(el.scrollTop))
}

export function useMainScrollTop(trigger) {
  useEffect(() => {
    const el = getMainScroll()
    if (!el) return
    el.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [trigger])
}

export function useRestoreMainScroll(key, enabled) {
  useEffect(() => {
    if (!enabled) return

    const raw = sessionStorage.getItem(key)
    if (raw == null) return

    sessionStorage.removeItem(key)
    const top = Number(raw)
    if (!Number.isFinite(top)) return

    const frame = requestAnimationFrame(() => {
      getMainScroll()?.scrollTo({ top, left: 0, behavior: 'auto' })
    })

    return () => cancelAnimationFrame(frame)
  }, [key, enabled])
}
