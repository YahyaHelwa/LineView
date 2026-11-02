import { useMemo, useState } from 'react'
import { formatPercent } from '../lib/metrics'
import type { WorkOrder } from '../types'

type SortKey = 'id' | 'due' | 'progress' | 'priority'
const PRIORITY_RANK = { high: 0, normal: 1, low: 2 } as const

const progressOf = (o: WorkOrder) => (o.quantity > 0 ? o.completed / o.quantity : 0)

export function WorkOrderTable({ orders, todayIso }: { orders: WorkOrder[]; todayIso: string }) {
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

  function sortBy(key: SortKey) {
    if (key === sortKey) setAscending((a) => !a)
    else {
      setSortKey(key)
      setAscending(true)
    }
  }

  const header = (key: SortKey, label: string) => (
    <th scope="col" aria-sort={sortKey === key ? (ascending ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="th-button" onClick={() => sortBy(key)}>
        {label}
        <span aria-hidden="true">{sortKey === key ? (ascending ? ' ▲' : ' ▼') : ''}</span>
      </button>
    </th>
  )

  return (
    <section className="panel" aria-labelledby="orders-title">
      <div className="panel__head">
        <h2 id="orders-title">Work orders</h2>
      </div>
      <div className="table-wrap">
        <table className="orders">
          <thead>
            <tr>
              {header('id', 'Order')}
              <th scope="col">Product</th>
              {header('priority', 'Priority')}
              {header('progress', 'Progress')}
              {header('due', 'Due')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((o) => {
              const done = o.completed >= o.quantity
              const late = !done && o.due < todayIso
              return (
                <tr key={o.id}>
                  <td data-label="Order">{o.id.toUpperCase()}</td>
                  <td data-label="Product">{o.product}</td>
                  <td data-label="Priority">
                    <span className={`pill pill--${o.priority}`}>{o.priority}</span>
                  </td>
                  <td data-label="Progress">
                    <div className="progress">
                      <div className="meter meter--small" aria-hidden="true">
                        <div className={`meter__fill ${done ? 'meter__fill--done' : ''}`} style={{ width: formatPercent(progressOf(o)) }} />
                      </div>
                      <span>
                        {o.completed}/{o.quantity}
                      </span>
                    </div>
                  </td>
                  <td data-label="Due" className={late ? 'late' : ''}>
                    {o.due}
                    {late && <span className="visually-hidden"> (overdue)</span>}
                    {done && <span className="done-tag">done</span>}
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
