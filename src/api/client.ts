// Small typed wrapper around fetch for JSON REST endpoints.

export class ApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  /** Abort the request if the server hasn't answered after this many ms. */
  timeoutMs?: number
}

export async function requestJson<T>(baseUrl: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = 8000 } = options

  // Combine the caller's signal (e.g. component unmount) with a timeout.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)
  const onCallerAbort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', onCallerAbort, { once: true })

  let response: Response
  try {
    response = await fetch(new URL(path, baseUrl), {
      method,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new ApiError(`Request to ${path} timed out after ${timeoutMs} ms`, null)
    }
    if (signal?.aborted) throw err
    throw new ApiError(`Could not reach the server (${path})`, null)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }

  if (!response.ok) {
    throw new ApiError(`${method} ${path} failed with HTTP ${response.status}`, response.status)
  }
  if (response.status === 204) return undefined as T

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(`${method} ${path} returned invalid JSON`, response.status)
  }
}
