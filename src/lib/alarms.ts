import type { View } from '../hooks/useHashView'
import type { Defect, Station, WorkOrder } from '../types'

export type AlarmSeverity = 'alarm' | 'warn' | 'info'

export interface Alarm {
  key: string
  severity: AlarmSeverity
  source: string
  message: string
  detail: string
  view: View
}

const RANK: Record<AlarmSeverity, number> = { alarm: 0, warn: 1, info: 2 }
export const SEVERITY_LABEL: Record<AlarmSeverity, string> = { alarm: 'Alarm', warn: 'Warning', info: 'Info' }

/** Turns the current snapshot into an alarm list: stopped stations, open defects, overdue orders. */
export function buildAlarms(stations: Station[], orders: WorkOrder[], defects: Defect[], todayIso: string): Alarm[] {
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? id.toUpperCase()
  const alarms: Alarm[] = []

  for (const s of stations) {
    if (s.status === 'down' || s.status === 'maintenance') {
      alarms.push({
        key: `st-${s.id}`,
        severity: s.status === 'down' ? 'alarm' : 'warn',
        source: s.id.toUpperCase(),
        message: s.status === 'down' ? `${s.name} stopped` : `${s.name} in maintenance`,
        detail: `Operator ${s.operator}${s.currentOrderId ? ` · ${s.currentOrderId.toUpperCase()}` : ''}`,
        view: 'stations',
      })
    }
  }
  for (const d of defects) {
    if (d.status !== 'open') continue
    alarms.push({
      key: `df-${d.id}`,
      severity: d.severity === 'critical' ? 'alarm' : d.severity === 'major' ? 'warn' : 'info',
      source: d.id.toUpperCase(),
      message: d.description,
      detail: `${d.severity} defect · ${stationName(d.stationId)} · ${d.workOrderId.toUpperCase()}`,
      view: 'quality',
    })
  }
  for (const o of orders) {
    if (o.completed < o.quantity && o.due < todayIso) {
      alarms.push({
        key: `wo-${o.id}`,
        severity: 'warn',
        source: o.id.toUpperCase(),
        message: `${o.product} is overdue`,
        detail: `Due ${o.due} · ${o.completed}/${o.quantity} done`,
        view: 'orders',
      })
    }
  }
  return alarms.toSorted((a, b) => RANK[a.severity] - RANK[b.severity])
}
