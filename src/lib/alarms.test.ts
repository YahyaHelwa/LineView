import { describe, expect, it } from 'vitest'
import seed from '../data/seed.json'
import type { Defect, Station, WorkOrder } from '../types'
import { buildAlarms } from './alarms'

const stations = seed.stations as Station[]
const orders = seed.workOrders as WorkOrder[]
const defects = seed.defects as Defect[]

describe('buildAlarms', () => {
  // Seed data is written for 30 Oct 2026: WO-2043 (due 31 Oct) is not overdue yet.
  const alarms = buildAlarms(stations, orders, defects, '2026-10-30')

  it('lists stopped stations and open defects, most severe first', () => {
    expect(alarms.map((a) => a.source)).toEqual(['ST-30', 'DF-302', 'ST-60', 'DF-301'])
    expect(alarms.map((a) => a.severity)).toEqual(['alarm', 'alarm', 'warn', 'warn'])
  })

  it('skips closed defects', () => {
    expect(alarms.some((a) => a.source === 'DF-303')).toBe(false)
  })

  it('adds unfinished orders that are past due, linking to the orders view', () => {
    const late = buildAlarms(stations, orders, defects, '2026-11-01').find((a) => a.source === 'WO-2043')
    expect(late).toMatchObject({ severity: 'warn', view: 'orders' })
  })
})
