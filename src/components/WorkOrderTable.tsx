import { useMemo, useState } from 'react'
import { orderState, type OrderState } from '../lib/metrics'
import type { Station, WorkOrder } from '../types'
import { Meter } from './Meter'

type SortKey = 'id' | 'due' | 'progress' | 'priority'
const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const

const progressOf = (o: WorkOrder) => (o.quantity > 0 ? o.completed / o.quantity : 0)

const STATE_LABEL: Record<OrderState, string> = {
  complete: 'Complete',
  overdue: 'Overdue',
  'due-soon': 'Due soon',
  'on-track': 'On track',
}

export function OrderStateTag({ state }: { state: OrderState }) {
  return <span className={`tag tag--${state}`}>{STATE_LABEL[state]}</span>
}

interface Props {
  orders: WorkOrder[]
  stations: Station[]
  todayIso: string
  soonIso: string
}

export function WorkOrderTable({ orders, stations, todayIso, soonIso }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('due')
  const [ascending, setAscending] = useState(true)

  const sorted = useMemo(() => {
    const copy = [...orders]
    copy.sort((a, b) => {
      let diff = 0
      if (sortKey === 'id') diff = a.id.localeCompare(b.id)
      if (sortKey === 'due') diff = a.due.localeCompare(b.due)
      if (sortKey === 'progress') diff = progressOf(a) - progressOf(b)
      if (sortKey === 'priority') diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      return ascending ? diff : -diff
    })
    return copy
  }, [orders, sortKey, ascending])

  const states = orders.map((o) => orderState(o, todayIso, soonIso))
  const overdue = states.filter((s) => s === 'overdue').length
  const complete = states.filter((s) => s === 'complete').length
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? ''

  function sortBy(key: SortKey) {
    if (key === sortKey) setAscending((a) => !a)
    else {
      setSortKey(key)
      setAscending(true)
    }
  }

  const header = (key: SortKey, label: string, className?: string) => (
    <th scope="col" className={className} aria-sort={sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="th-button" onClick={() => sortBy(key)}>
        {label}
        <span className="th-button__arrow" aria-hidden="true">
          {sortKey === key ? (ascending ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  )

  return (
    <section className="panel panel--flush" aria-labelledby="orders-title">
      <div className="panel__head panel__head--bar">
        <h2 id="orders-title" className="visually-hidden">
          Work orders
        </h2>
        <p className="panel__summary">
          <span className="mono">{orders.length}</span> orders · <span className="mono">{overdue}</span> overdue ·{' '}
          <span className="mono">{complete}</span> complete
        </p>
      </div>
      <div className="table-wrap">
        <table className="grid grid--orders">
          <thead>
            <tr>
              {header('id', 'Order')}
              <th scope="col">Product</th>
              <th scope="col">Station</th>
              {header('priority', 'Priority')}
              {header('progress', 'Progress')}
              {header('due', 'Due')}
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((o) => {
              const state = orderState(o, todayIso, soonIso)
              return (
                <tr key={o.id} className={state === 'overdue' ? 'row--overdue' : undefined}>
                  <td data-label="Order" className="mono cell-id">
                    {o.id.toUpperCase()}
                  </td>
                  <td data-label="Product">{o.product}</td>
                  <td data-label="Station">
                    <span className="mono">{o.stationId.toUpperCase()}</span>
                    <span className="cell-sub">{stationName(o.stationId)}</span>
                  </td>
                  <td data-label="Priority">
                    <span className={`prio prio--${o.priority}`}>{o.priority}</span>
                  </td>
                  <td data-label="Progress">
                    <div className="progress">
                      <Meter value={progressOf(o)} size="sm" label={`${o.completed} of ${o.quantity} done`} />
                      <span className="mono">
                        {o.completed}/{o.quantity}
                      </span>
                    </div>
                  </td>
                  <td data-label="Due" className="mono">
                    {o.due}
                  </td>
                  <td data-label="State">
                    <OrderStateTag state={state} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
