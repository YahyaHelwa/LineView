import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, requestJson } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('requestJson', () => {
  it('parses JSON on success and sends the right request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ id: 'st-10' }]))
    vi.stubGlobal('fetch', fetchMock)

    const data = await requestJson<{ id: string }[]>('http://localhost:3001', '/stations')

    expect(data).toEqual([{ id: 'st-10' }])
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('http://localhost:3001/stations')
    expect(init.method).toBe('GET')
  })

  it('serialises the body for POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 'df-1' }, 201))
    vi.stubGlobal('fetch', fetchMock)

    await requestJson('http://localhost:3001', '/defects', { method: 'POST', body: { severity: 'minor' } })

    const init = fetchMock.mock.calls[0][1]
    expect(init.body).toBe(JSON.stringify({ severity: 'minor' }))
    expect(init.headers['Content-Type']).toBe('application/json')
  })

  it('throws ApiError with the status code on HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'nope' }, 404)))

    await expect(requestJson('http://localhost:3001', '/missing')).rejects.toMatchObject({ name: 'ApiError', status: 404 })
  })

  it('wraps network failures in an ApiError without a status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const err = await requestJson('http://localhost:3001', '/stations').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBeNull()
  })
})
