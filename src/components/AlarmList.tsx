import { hrefFor } from '../hooks/useHashView'
import { SEVERITY_LABEL, type Alarm } from '../lib/alarms'
import { Icon } from './Icon'

export function AlarmList({ alarms }: { alarms: Alarm[] }) {
  return (
    <section className="panel" aria-labelledby="alarms-title">
      <div className="panel__head">
        <h2 id="alarms-title">
          Active alarms <span className="count mono">{alarms.length}</span>
        </h2>
        <p className="panel__note">Stopped stations, open defects, overdue orders</p>
      </div>
      {alarms.length === 0 ? (
        <p className="empty">No active alarms.</p>
      ) : (
        <ul className="alarms">
          {alarms.map((a) => (
            <li key={a.key}>
              <a className={`alarm alarm--${a.severity}`} href={hrefFor(a.view)}>
                <span className="alarm__sev">
                  <span className="alarm__mark" aria-hidden="true" />
                  {SEVERITY_LABEL[a.severity]}
                </span>
                <span className="alarm__source mono">{a.source}</span>
                <span className="alarm__body">
                  <span className="alarm__msg">{a.message}</span>
                  <span className="alarm__detail">{a.detail}</span>
                </span>
                <Icon name="chevron" size={16} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
