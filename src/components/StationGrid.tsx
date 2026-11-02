import { useMemo, useState } from 'react'
import { computeOee, formatPercent } from '../lib/metrics'
import type { Station, StationStatus } from '../types'
import { STATUS_LABELS, StatusBadge } from './StatusBadge'

type Filter = StationStatus | 'all'
const FILTERS: Filter[] = ['all', 'running', 'idle', 'down', 'maintenance']

export function StationGrid({ stations }: { stations: Station[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stations.filter(
      (s) =>
        (filter === 'all' || s.status === filter) &&
        (q === '' || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.operator.toLowerCase().includes(q)),
    )
  }, [stations, filter, query])

  return (
    <section className="panel" aria-labelledby="stations-title">
      <div className="panel__head">
        <h2 id="stations-title">Stations</h2>
        <div className="toolbar">
          <div className="chips" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`chip ${filter === f ? 'chip--active' : ''}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
          <label className="search">
            <span className="visually-hidden">Search stations</span>
            <input type="search" placeholder="Search station, ID or operator" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="empty">No stations match this filter.</p>
      ) : (
        <ul className="station-grid">
          {visible.map((s) => {
            const m = computeOee(s)
            return (
              <li key={s.id} className={`station station--${s.status}`}>
                <div className="station__top">
                  <div>
                    <p className="station__id">{s.id.toUpperCase()}</p>
                    <h3 className="station__name">{s.name}</h3>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="meter" role="img" aria-label={`OEE ${formatPercent(m.oee)}`}>
                  <div className="meter__fill" style={{ width: formatPercent(m.oee) }} />
                </div>
                <dl className="station__stats">
                  <div>
                    <dt>OEE</dt>
                    <dd>{formatPercent(m.oee)}</dd>
                  </div>
                  <div>
                    <dt>Avail.</dt>
                    <dd>{formatPercent(m.availability)}</dd>
                  </div>
                  <div>
                    <dt>Perf.</dt>
                    <dd>{formatPercent(m.performance)}</dd>
                  </div>
                  <div>
                    <dt>Quality</dt>
                    <dd>{formatPercent(m.quality)}</dd>
                  </div>
                </dl>
                <p className="station__meta">
                  {s.goodCount}/{s.totalCount} good · {s.operator} · {s.currentOrderId?.toUpperCase() ?? 'no active order'}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
