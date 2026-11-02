import { hrefFor } from '../hooks/useHashView'
import { orderState } from '../lib/metrics'
import type { WorkOrder } from '../types'
import { Meter } from './Meter'
import { OrderStateTag } from './WorkOrderTable'

/** Compact list of unfinished orders, soonest due first, for the overview. */
export function OrdersDue({ orders, todayIso, soonIso }: { orders: WorkOrder[]; todayIso: string; soonIso: string }) {
  const open = orders.filter((o) => o.completed < o.quantity).toSorted((a, b) => a.due.localeCompare(b.due))

  return (
    <section className="panel" aria-labelledby="due-title">
      <div className="panel__head">
        <h2 id="due-title">Open orders by due date</h2>
        <a className="panel__link" href={hrefFor('orders')}>
          All work orders
        </a>
      </div>
      {open.length === 0 ? (
        <p className="empty">All orders are complete.</p>
      ) : (
        <table className="grid grid--compact">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col" className="col-progress">Progress</th>
              <th scope="col">Due</th>
              <th scope="col">State</th>
            </tr>
          </thead>
          <tbody>
            {open.map((o) => {
              const state = orderState(o, todayIso, soonIso)
              return (
                <tr key={o.id}>
                  <td>
                    <span className="mono">{o.id.toUpperCase()}</span>
                    <span className="cell-sub">{o.product}</span>
                  </td>
                  <td className="col-progress">
                    <div className="progress">
                      <Meter value={o.completed / o.quantity} size="sm" label={`${o.completed} of ${o.quantity} done`} />
                      <span className="mono">
                        {o.completed}/{o.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="mono">{o.due}</td>
                  <td>
                    <OrderStateTag state={state} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
