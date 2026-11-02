import { useEffect, useState } from 'react'

export const VIEWS = ['overview', 'stations', 'orders', 'quality'] as const
export type View = (typeof VIEWS)[number]

/** "#/stations" → "stations"; anything unknown (e.g. the skip link's "#main") → null. */
export function viewFromHash(hash: string): View | null {
  const value = hash.replace(/^#\/?/, '')
  return (VIEWS as readonly string[]).includes(value) ? (value as View) : null
}

export const hrefFor = (view: View) => `#/${view}`

/**
 * Hash-based view switching: links stay shareable, the back button works,
 * and it needs no router or server config on GitHub Pages.
 */
export function useHashView(): View {
  const [view, setView] = useState<View>(() => viewFromHash(window.location.hash) ?? 'overview')

  useEffect(() => {
    const onChange = () => {
      const next = viewFromHash(window.location.hash)
      if (next) setView(next)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return view
}
