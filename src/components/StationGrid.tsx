import { useMemo, useState } from 'react'
import { computeOee, formatPercent, OEE_TARGET, oeeTone } from '../lib/metrics'
import type { Station, StationStatus } from '../types'
import { Icon } from './Icon'
import { Meter } from './Meter'
import { STATUS_LABELS, StatusBadge } from './StatusBadge'

type Filter = StationStatus | 'all'
const FILTERS: Filter[] = ['all', 'running', 'idle', 'down', 'maintenance']

/** Station data grid: one row per station with OEE broken into its three factors. */
export function StationGrid({ stations }: { stations: Station[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: stations.length, running: 0, idle: 0, down: 0, maintenance: 0 }
    for (const s of stations) c[s.status] += 1
    return c
  }, [stations])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stations
      .filter(
        (s) =>
          (filter === 'all' || s.status === filter) &&
          (q === '' || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.operator.toLowerCase().includes(q)),
      )
      .toSorted((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
  }, [stations, filter, query])

  return (
    <section className="panel panel--flush" aria-labelledby="stations-title">
      <div className="panel__head panel__head--bar">
        <h2 id="stations-title" className="visually-hidden">
          Stations
        </h2>
        <div className="segmented" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="segmented__option"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
              <span className="segmented__count mono">{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="search" size={16} />
          <span className="visually-hidden">Search stations</span>
          <input type="search" placeholder="Search station, ID or operator" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="empty empty--pad">No stations match this filter.</p>
      ) : (
        <div className="table-wrap">
          <table className="grid grid--stations">
            <thead>
              <tr>
                <th scope="col">Station</th>
                <th scope="col">Status</th>
                <th scope="col">Operator</th>
                <th scope="col">Order</th>
                <th scope="col" className="col-oee">
                  OEE
                </th>
                <th scope="col" className="num">
                  Avail.
                </th>
                <th scope="col" className="num">
                  Perf.
                </th>
                <th scope="col" className="num">
                  Quality
                </th>
                <th scope="col" className="num">
                  Good / total
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => {
                const m = computeOee(s)
                const tone = oeeTone(m.oee)
                return (
                  <tr key={s.id} className={`row--${s.status}`}>
                    <td data-label="Station">
                      <span className="mono cell-id">{s.id.toUpperCase()}</span>
                      <span className="cell-main">{s.name}</span>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={s.status} />
                    </td>
                    <td data-label="Operator">{s.operator}</td>
                    <td data-label="Order" className="mono">
                      {s.currentOrderId?.toUpperCase() ?? <span className="dim">none</span>}
                    </td>
                    <td data-label="OEE" className="col-oee">
                      <div className="progress">
                        <Meter value={m.oee} target={OEE_TARGET} tone={tone === 'ok' ? 'neutral' : tone} label={`OEE ${formatPercent(m.oee)}`} />
                        <span className={`mono tone-text--${tone}`}>{formatPercent(m.oee)}</span>
                      </div>
                    </td>
                    <td data-label="Availability" className="num mono">
                      {formatPercent(m.availability)}
                    </td>
                    <td data-label="Performance" className="num mono">
                      {formatPercent(m.performance)}
                    </td>
                    <td data-label="Quality" className="num mono">
                      {formatPercent(m.quality)}
                    </td>
                    <td data-label="Good / total" className="num mono">
                      {s.goodCount}/{s.totalCount}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
