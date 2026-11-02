import { describe, expect, it } from 'vitest'
import type { Defect, Station, WorkOrder } from '../types'
import { computeOee, formatPercent, summarize } from './metrics'

const station = (over: Partial<Station> = {}): Station => ({
  id: 'st-1',
  name: 'Test station',
  status: 'running',
  operator: 'Tester',
  currentOrderId: null,
  plannedMinutes: 400,
  runMinutes: 360,
  idealCycleSec: 60,
  totalCount: 300,
  goodCount: 291,
  updatedAt: '2026-10-30T09:00:00Z',
  ...over,
})

describe('computeOee', () => {
  it('multiplies availability, performance and quality', () => {
    const m = computeOee(station())
    expect(m.availability).toBeCloseTo(0.9) // 360 / 400
    expect(m.performance).toBeCloseTo((60 * 300) / (360 * 60)) // 0.8333
    expect(m.quality).toBeCloseTo(0.97) // 291 / 300
    expect(m.oee).toBeCloseTo(0.9 * 0.8333 * 0.97, 3)
  })

  it('returns zeros instead of NaN when nothing has run yet', () => {
    const m = computeOee(station({ runMinutes: 0, totalCount: 0, goodCount: 0 }))
    expect(m).toEqual({ availability: 0, performance: 0, quality: 0, oee: 0 })
  })

  it('caps values at 100% when data is inconsistent', () => {
    const m = computeOee(station({ runMinutes: 500, idealCycleSec: 600 }))
    expect(m.availability).toBe(1)
    expect(m.performance).toBe(1)
  })
})

describe('summarize', () => {
  const orders: WorkOrder[] = [
    { id: 'wo-1', product: 'A', quantity: 10, completed: 5, due: '2026-11-01', stationId: 'st-1', priority: 'high' },
    { id: 'wo-2', product: 'B', quantity: 10, completed: 10, due: '2026-10-31', stationId: 'st-1', priority: 'low' },
    { id: 'wo-3', product: 'C', quantity: 20, completed: 0, due: '2026-11-20', stationId: 'st-2', priority: 'normal' },
  ]
  const defects: Defect[] = [
    { id: 'd1', stationId: 'st-1', workOrderId: 'wo-1', category: 'wiring', severity: 'critical', description: 'x', status: 'open', createdAt: '' },
    { id: 'd2', stationId: 'st-1', workOrderId: 'wo-1', category: 'wiring', severity: 'minor', description: 'x', status: 'closed', createdAt: '' },
  ]

  it('counts station states, open defects and orders due soon', () => {
    const s = summarize([station(), station({ id: 'st-2', status: 'down' })], orders, defects, new Date('2026-10-30T12:00:00Z'))
    expect(s.running).toBe(1)
    expect(s.stopped).toBe(1)
    expect(s.openDefects).toBe(1)
    expect(s.criticalDefects).toBe(1)
    expect(s.ordersDueSoon).toBe(1) // wo-1 only: wo-2 is finished, wo-3 is due later
    expect(s.overallProgress).toBeCloseTo(15 / 40)
  })

  it('handles an empty line', () => {
    const s = summarize([], [], [])
    expect(s.lineOee).toBe(0)
    expect(s.overallProgress).toBe(0)
  })
})

describe('formatPercent', () => {
  it('formats and clamps', () => {
    expect(formatPercent(0.4567, 1)).toBe('45.7%')
    expect(formatPercent(1.4)).toBe('100%')
  })
})
