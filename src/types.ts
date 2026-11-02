// Domain types shared by the API layer, the mock and the UI.

export type StationStatus = 'running' | 'idle' | 'down' | 'maintenance'

export interface Station {
  id: string
  name: string
  status: StationStatus
  operator: string
  currentOrderId: string | null
  /** Planned production time in this shift, in minutes. */
  plannedMinutes: number
  /** Time the station actually ran in this shift, in minutes. */
  runMinutes: number
  /** Ideal cycle time for one unit, in seconds. */
  idealCycleSec: number
  /** Units produced this shift (good + rejected). */
  totalCount: number
  /** Units that passed inspection this shift. */
  goodCount: number
  updatedAt: string
}

export type Priority = 'low' | 'normal' | 'high'

export interface WorkOrder {
  id: string
  product: string
  quantity: number
  completed: number
  /** ISO date (YYYY-MM-DD). */
  due: string
  stationId: string
  priority: Priority
}

export type DefectCategory = 'wiring' | 'mechanical' | 'labeling' | 'test-failure' | 'other'
export type Severity = 'minor' | 'major' | 'critical'
export type DefectStatus = 'open' | 'closed'

export interface Defect {
  id: string
  stationId: string
  workOrderId: string
  category: DefectCategory
  severity: Severity
  description: string
  status: DefectStatus
  createdAt: string
}

/** What the form sends when a new defect is reported (the server adds id, status and createdAt). */
export type NewDefect = Pick<Defect, 'stationId' | 'workOrderId' | 'category' | 'severity' | 'description'>
