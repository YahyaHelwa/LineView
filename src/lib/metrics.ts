import type { Defect, Station, WorkOrder } from '../types'

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0)

export interface Oee {
  availability: number
  performance: number
  quality: number
  oee: number
}

/**
 * Overall Equipment Effectiveness = Availability × Performance × Quality.
 * - Availability: run time / planned time
 * - Performance: (ideal cycle time × units produced) / run time
 * - Quality: good units / units produced
 */
export function computeOee(s: Pick<Station, 'plannedMinutes' | 'runMinutes' | 'idealCycleSec' | 'totalCount' | 'goodCount'>): Oee {
  const availability = clamp01(s.plannedMinutes > 0 ? s.runMinutes / s.plannedMinutes : 0)
  const performance = clamp01(s.runMinutes > 0 ? (s.idealCycleSec * s.totalCount) / (s.runMinutes * 60) : 0)
  const quality = clamp01(s.totalCount > 0 ? s.goodCount / s.totalCount : 0)
  return { availability, performance, quality, oee: availability * performance * quality }
}

export interface LineSummary {
  lineOee: number
  running: number
  stopped: number
  openDefects: number
  criticalDefects: number
  ordersDueSoon: number
  overallProgress: number
}

/** Line-level KPIs. Line OEE is weighted by planned time so long-running stations count more. */
export function summarize(stations: Station[], orders: WorkOrder[], defects: Defect[], today = new Date()): LineSummary {
  const planned = stations.reduce((sum, s) => sum + s.plannedMinutes, 0)
  const lineOee = planned > 0 ? stations.reduce((sum, s) => sum + computeOee(s).oee * s.plannedMinutes, 0) / planned : 0

  const open = defects.filter((d) => d.status === 'open')
  const soon = new Date(today)
  soon.setUTCDate(soon.getUTCDate() + 3)
  const soonIso = soon.toISOString().slice(0, 10)

  const totalQty = orders.reduce((sum, o) => sum + o.quantity, 0)
  const totalDone = orders.reduce((sum, o) => sum + Math.min(o.completed, o.quantity), 0)

  return {
    lineOee,
    running: stations.filter((s) => s.status === 'running').length,
    stopped: stations.filter((s) => s.status === 'down' || s.status === 'maintenance').length,
    openDefects: open.length,
    criticalDefects: open.filter((d) => d.severity === 'critical').length,
    ordersDueSoon: orders.filter((o) => o.completed < o.quantity && o.due <= soonIso).length,
    overallProgress: totalQty > 0 ? totalDone / totalQty : 0,
  }
}

export const formatPercent = (x: number, digits = 0) => `${(clamp01(x) * 100).toFixed(digits)}%`
