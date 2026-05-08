import { useEffect } from 'react'

function getScrollTop() {
  if (typeof window === 'undefined') return 0
  return window.scrollY || document.documentElement.scrollTop || 0
}

function scrollTo(top) {
  if (typeof window === 'undefined') return
  window.scrollTo({ top, left: 0, behavior: 'auto' })
}

export function saveMainScrollPosition(key) {
  sessionStorage.setItem(key, String(getScrollTop()))
}

export function useMainScrollTop(trigger) {
  useEffect(() => {
    scrollTo(0)
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
      scrollTo(top)
    })

    return () => cancelAnimationFrame(frame)
  }, [key, enabled])
}
