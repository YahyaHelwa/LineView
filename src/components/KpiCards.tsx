import { formatPercent, type LineSummary } from '../lib/metrics'

interface Props {
  summary: LineSummary
  stationCount: number
}

export function KpiCards({ summary, stationCount }: Props) {
  const oeeTone = summary.lineOee >= 0.65 ? 'good' : summary.lineOee >= 0.45 ? 'warn' : 'bad'
  return (
    <section className="kpis" aria-label="Line summary">
      <article className={`kpi kpi--${oeeTone}`}>
        <h3 className="kpi__label">Line OEE</h3>
        <p className="kpi__value">{formatPercent(summary.lineOee, 1)}</p>
        <p className="kpi__hint">Availability × performance × quality</p>
      </article>
      <article className="kpi">
        <h3 className="kpi__label">Stations running</h3>
        <p className="kpi__value">
          {summary.running}
          <span className="kpi__of">/{stationCount}</span>
        </p>
        <p className="kpi__hint">{summary.stopped} down or in maintenance</p>
      </article>
      <article className={`kpi ${summary.criticalDefects > 0 ? 'kpi--bad' : ''}`}>
        <h3 className="kpi__label">Open defects</h3>
        <p className="kpi__value">{summary.openDefects}</p>
        <p className="kpi__hint">{summary.criticalDefects} critical</p>
      </article>
      <article className={`kpi ${summary.ordersDueSoon > 0 ? 'kpi--warn' : ''}`}>
        <h3 className="kpi__label">Order progress</h3>
        <p className="kpi__value">{formatPercent(summary.overallProgress)}</p>
        <p className="kpi__hint">{summary.ordersDueSoon} unfinished order(s) due within 3 days</p>
      </article>
    </section>
  )
}
