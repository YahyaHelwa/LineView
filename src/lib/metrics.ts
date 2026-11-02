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
  const soonIso = addDaysIso(today, DUE_SOON_DAYS)

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

/** OEE at or above this is on target (green); below OEE_WARN is an alarm (red). */
export const OEE_TARGET = 0.65
export const OEE_WARN = 0.45

export type Tone = 'ok' | 'warn' | 'alarm'
export const oeeTone = (oee: number): Tone => (oee >= OEE_TARGET ? 'ok' : oee >= OEE_WARN ? 'warn' : 'alarm')

export type OrderState = 'complete' | 'overdue' | 'due-soon' | 'on-track'

/** Where a work order stands relative to its due date (ISO dates compare as strings). */
export function orderState(o: WorkOrder, todayIso: string, soonIso: string): OrderState {
  if (o.completed >= o.quantity) return 'complete'
  if (o.due < todayIso) return 'overdue'
  if (o.due <= soonIso) return 'due-soon'
  return 'on-track'
}

/** Unfinished orders due within this many days count as "due soon". */
export const DUE_SOON_DAYS = 3

/** ISO date `days` after `date` (UTC), e.g. for the "due within 3 days" window. */
export function addDaysIso(date: Date, days: number): string {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
