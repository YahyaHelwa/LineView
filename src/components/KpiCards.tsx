import { DUE_SOON_DAYS, formatPercent, OEE_TARGET, oeeTone, type LineSummary } from '../lib/metrics'
import type { Station } from '../types'
import { Meter } from './Meter'

interface Props {
  summary: LineSummary
  stations: Station[]
}

const TONE_TEXT = { ok: 'On target', warn: 'Below target', alarm: 'Well below target' } as const

/** KPI strip across the top of the overview: one row of key figures, separated by rules. */
export function KpiCards({ summary, stations }: Props) {
  const tone = oeeTone(summary.lineOee)
  const good = stations.reduce((sum, s) => sum + s.goodCount, 0)
  const total = stations.reduce((sum, s) => sum + s.totalCount, 0)
  const idle = stations.length - summary.running - summary.stopped

  return (
    <section className="kpis" aria-label="Line summary">
      <dl className="kpis__row">
        <div className={`kpi kpi--${tone}`}>
          <dt className="kpi__label">Line OEE</dt>
          <dd className="kpi__value">{formatPercent(summary.lineOee, 1)}</dd>
          <dd className="kpi__sub">
            <Meter value={summary.lineOee} target={OEE_TARGET} tone={tone === 'ok' ? 'neutral' : tone} label={`Line OEE ${formatPercent(summary.lineOee, 1)}, target ${formatPercent(OEE_TARGET)}`} size="sm" />
            <span className={`kpi__flag kpi__flag--${tone}`}>
              {TONE_TEXT[tone]} · target {formatPercent(OEE_TARGET)}
            </span>
          </dd>
        </div>

        <div className={`kpi ${summary.stopped > 0 ? 'kpi--warn' : ''}`}>
          <dt className="kpi__label">Stations running</dt>
          <dd className="kpi__value">
            {summary.running}
            <span className="kpi__of">/{stations.length}</span>
          </dd>
          <dd className="kpi__sub">
            {summary.stopped} stopped · {idle} idle
          </dd>
        </div>

        <div className="kpi">
          <dt className="kpi__label">Good units (shift)</dt>
          <dd className="kpi__value">{good.toLocaleString('en-GB')}</dd>
          <dd className="kpi__sub">
            of {total.toLocaleString('en-GB')} produced · yield {formatPercent(total > 0 ? good / total : 0, 1)}
          </dd>
        </div>

        <div className={`kpi ${summary.criticalDefects > 0 ? 'kpi--alarm' : ''}`}>
          <dt className="kpi__label">Open defects</dt>
          <dd className="kpi__value">{summary.openDefects}</dd>
          <dd className="kpi__sub">{summary.criticalDefects} critical</dd>
        </div>

        <div className="kpi">
          <dt className="kpi__label">Order progress</dt>
          <dd className="kpi__value">{formatPercent(summary.overallProgress)}</dd>
          <dd className="kpi__sub">
            {summary.ordersDueSoon} open order{summary.ordersDueSoon === 1 ? '' : 's'} due in {DUE_SOON_DAYS} days
          </dd>
        </div>
      </dl>
    </section>
  )
}
