import { requestJson } from './client'
import seed from '../data/seed.json'
import type { Defect, NewDefect, Station, StationStatus, WorkOrder } from '../types'

/** Everything the UI needs from the backend. Two implementations: real HTTP and an in-browser mock. */
export interface LineApi {
  readonly mode: 'http' | 'demo'
  getStations(signal?: AbortSignal): Promise<Station[]>
  getWorkOrders(signal?: AbortSignal): Promise<WorkOrder[]>
  getDefects(signal?: AbortSignal): Promise<Defect[]>
  createDefect(input: NewDefect): Promise<Defect>
  closeDefect(id: string): Promise<Defect>
}

export function createHttpApi(baseUrl: string): LineApi {
  return {
    mode: 'http',
    getStations: (signal) => requestJson<Station[]>(baseUrl, '/stations', { signal }),
    getWorkOrders: (signal) => requestJson<WorkOrder[]>(baseUrl, '/workOrders', { signal }),
    getDefects: (signal) => requestJson<Defect[]>(baseUrl, '/defects', { signal }),
    createDefect: (input) =>
      requestJson<Defect>(baseUrl, '/defects', {
        method: 'POST',
        body: { ...input, status: 'open', createdAt: new Date().toISOString() },
      }),
    closeDefect: (id) =>
      requestJson<Defect>(baseUrl, `/defects/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status: 'closed' } }),
  }
}

// ---------------------------------------------------------------------------
// Demo mode: an in-memory copy of the same JSON the mock server uses, so the app
// works on a static host (GitHub Pages) without a backend.
// ---------------------------------------------------------------------------

const SEED_DAY = Date.UTC(2026, 9, 30) // seed data was written for 30 Oct 2026

/** Shift a seed date so the demo always looks "current" relative to today. */
function rebaseDate(isoDate: string, today = new Date()): string {
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const shifted = new Date(Date.parse(isoDate) + (todayUtc - SEED_DAY))
  return isoDate.length === 10 ? shifted.toISOString().slice(0, 10) : shifted.toISOString()
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const clone = <T,>(value: T): T => structuredClone(value)

export function createDemoApi(latencyMs = 250): LineApi {
  const stations: Station[] = (seed.stations as Station[]).map((s) => ({ ...s, updatedAt: new Date().toISOString() }))
  const workOrders: WorkOrder[] = (seed.workOrders as WorkOrder[]).map((w) => ({ ...w, due: rebaseDate(w.due) }))
  const defects: Defect[] = (seed.defects as Defect[]).map((d) => ({ ...d, createdAt: rebaseDate(d.createdAt) }))
  let nextDefect = 304

  /** Advance the simulation a little so polling shows live-looking changes. */
  function tick() {
    for (const s of stations) {
      if (s.status !== 'running') continue
      if (Math.random() < 0.5) {
        s.totalCount += 1
        if (Math.random() < 0.96) s.goodCount += 1
      }
      s.runMinutes = Math.min(s.plannedMinutes, s.runMinutes + 0.5)
      s.updatedAt = new Date().toISOString()
      const order = workOrders.find((w) => w.id === s.currentOrderId)
      if (order && order.completed < order.quantity && Math.random() < 0.15) order.completed += 1
    }
    // Occasionally a station changes state, like a real line.
    if (Math.random() < 0.1) {
      const s = stations[Math.floor(Math.random() * stations.length)]
      const next: StationStatus[] = ['running', 'running', 'idle', 'down']
      s.status = next[Math.floor(Math.random() * next.length)]
    }
  }

  return {
    mode: 'demo',
    async getStations() {
      await wait(latencyMs)
      tick()
      return clone(stations)
    },
    async getWorkOrders() {
      await wait(latencyMs)
      return clone(workOrders)
    },
    async getDefects() {
      await wait(latencyMs)
      return clone(defects)
    },
    async createDefect(input) {
      await wait(latencyMs)
      const defect: Defect = { ...input, id: `df-${nextDefect++}`, status: 'open', createdAt: new Date().toISOString() }
      defects.unshift(defect)
      return clone(defect)
    },
    async closeDefect(id) {
      await wait(latencyMs)
      const defect = defects.find((d) => d.id === id)
      if (!defect) throw new Error(`Defect ${id} not found`)
      defect.status = 'closed'
      return clone(defect)
    },
  }
}

/** VITE_API_URL set → talk to a real REST API; otherwise run the in-browser demo. */
export function createApiFromEnv(): LineApi {
  const url = import.meta.env.VITE_API_URL as string | undefined
  return url ? createHttpApi(url) : createDemoApi()
}
