import { computeOee, formatPercent, OEE_TARGET, oeeTone } from '../lib/metrics'
import type { Station } from '../types'
import { Meter } from './Meter'
import { StatusBadge } from './StatusBadge'

/** The line drawn as it runs on the shop floor: stations in process order, left to right. */
export function LineFlow({ stations }: { stations: Station[] }) {
  const ordered = stations.toSorted((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))

  return (
    <section className="panel" aria-labelledby="flow-title">
      <div className="panel__head">
        <h2 id="flow-title">Line flow</h2>
        <p className="panel__note">
          Process order, left to right · tick on bars = OEE target {formatPercent(OEE_TARGET)}
        </p>
      </div>
      <ol className="flow">
        {ordered.map((s) => {
          const m = computeOee(s)
          const tone = oeeTone(m.oee)
          return (
            <li key={s.id} className={`flow__node flow__node--${s.status}`}>
              <div className="flow__top">
                <span className="flow__id mono">{s.id.toUpperCase()}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="flow__name">{s.name}</p>
              <p className={`flow__oee tone-text--${tone}`}>
                <span className="flow__num">{(m.oee * 100).toFixed(0)}</span>
                <span className="flow__unit">% OEE</span>
              </p>
              <Meter value={m.oee} target={OEE_TARGET} tone={tone === 'ok' ? 'neutral' : tone} label={`OEE ${formatPercent(m.oee)}`} />
              <p className="flow__meta">
                {s.operator} · <span className="mono">{s.currentOrderId?.toUpperCase() ?? 'no order'}</span>
              </p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
