import { useCallback, useEffect, useRef, useState } from 'react'

export interface PollingState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  lastUpdated: Date | undefined
  refresh: () => void
}

/**
 * Runs `fetcher` immediately and then every `intervalMs`.
 * Cancels in-flight requests on unmount, and keeps the last good data if a refresh fails.
 */
export function usePolling<T>(fetcher: (signal: AbortSignal) => Promise<T>, intervalMs: number): PollingState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>()
  const controllerRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const result = await fetcher(controller.signal)
      if (controller.signal.aborted) return
      setData(result)
      setError(undefined)
      setLastUpdated(new Date())
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    // Polling an external API is what effects are for; state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
    const id = setInterval(() => void load(), intervalMs)
    return () => {
      clearInterval(id)
      controllerRef.current?.abort()
    }
  }, [load, intervalMs])

  return { data, error, loading, lastUpdated, refresh: () => void load() }
}
