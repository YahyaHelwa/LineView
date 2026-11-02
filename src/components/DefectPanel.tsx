import { useState, type FormEvent } from 'react'
import { DESCRIPTION_MAX, validateDefect, type DefectErrors } from '../lib/validation'
import type { Defect, DefectCategory, NewDefect, Severity, Station, WorkOrder } from '../types'

const CATEGORIES: DefectCategory[] = ['wiring', 'mechanical', 'labeling', 'test-failure', 'other']
const SEVERITIES: Severity[] = ['minor', 'major', 'critical']

interface Props {
  stations: Station[]
  orders: WorkOrder[]
  defects: Defect[]
  onCreate: (input: NewDefect) => Promise<void>
  onClose: (id: string) => Promise<void>
}

const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const EMPTY: NewDefect = { stationId: '', workOrderId: '', category: 'wiring', severity: 'minor', description: '' }

export function DefectPanel({ stations, orders, defects, onCreate, onClose }: Props) {
  const [form, setForm] = useState<NewDefect>(EMPTY)
  const [errors, setErrors] = useState<DefectErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [showClosed, setShowClosed] = useState(false)

  const update = <K extends keyof NewDefect>(key: K, value: NewDefect[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const found = validateDefect(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSubmitting(true)
    setMessage(null)
    try {
      await onCreate({ ...form, description: form.description.trim() })
      setForm(EMPTY)
      setMessage({ tone: 'ok', text: 'Defect reported.' })
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not save the defect.' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClose(id: string) {
    setClosingId(id)
    try {
      await onClose(id)
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not close the defect.' })
    } finally {
      setClosingId(null)
    }
  }

  const ordersForStation = form.stationId ? orders.filter((o) => o.stationId === form.stationId || o.completed < o.quantity) : orders
  const list = defects
    .filter((d) => showClosed || d.status === 'open')
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)) // newest first
  const stationName = (id: string) => stations.find((s) => s.id === id)?.name ?? id

  return (
    <div className="quality">
      <section className="panel panel--flush" aria-labelledby="defects-title">
        <div className="panel__head panel__head--bar">
          <h2 id="defects-title">
            {showClosed ? 'All defects' : 'Open defects'} <span className="count mono">{list.length}</span>
          </h2>
          <label className="toggle">
            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} /> Show closed
          </label>
        </div>
        {list.length === 0 ? (
          <p className="empty empty--pad">No open defects.</p>
        ) : (
          <ul className="defects">
            {list.map((d) => (
              <li key={d.id} className={`defect defect--${d.severity} ${d.status === 'closed' ? 'defect--closed' : ''}`}>
                <span className={`sev sev--${d.severity}`}>
                  <span className="sev__mark" aria-hidden="true" />
                  {d.severity}
                </span>
                <div className="defect__body">
                  <p className="defect__desc">{d.description}</p>
                  <p className="defect__meta">
                    <span className="mono">{d.id.toUpperCase()}</span> · {stationName(d.stationId)} ·{' '}
                    <span className="mono">{d.workOrderId.toUpperCase()}</span> · {d.category}
                  </p>
                </div>
                <div className="defect__side">
                  <time className="mono" dateTime={d.createdAt}>
                    {formatStamp(d.createdAt)}
                  </time>
                  {d.status === 'open' ? (
                    <button type="button" className="button button--secondary button--sm" disabled={closingId === d.id} onClick={() => void handleClose(d.id)}>
                      {closingId === d.id ? 'Closing…' : 'Mark closed'}
                    </button>
                  ) : (
                    <span className="tag tag--complete">Closed</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="report-title">
        <form className="defect-form" onSubmit={handleSubmit} noValidate>
          <div className="panel__head">
            <h2 id="report-title">Report a defect</h2>
          </div>
          <div className="field">
            <label htmlFor="df-station">Station</label>
            <select
              id="df-station"
              value={form.stationId}
              onChange={(e) => update('stationId', e.target.value)}
              aria-invalid={Boolean(errors.stationId)}
              aria-describedby={errors.stationId ? 'df-station-err' : undefined}
            >
              <option value="">Select…</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id.toUpperCase()} · {s.name}
                </option>
              ))}
            </select>
            {errors.stationId && <p id="df-station-err" className="field__error">{errors.stationId}</p>}
          </div>

          <div className="field">
            <label htmlFor="df-order">Work order</label>
            <select
              id="df-order"
              value={form.workOrderId}
              onChange={(e) => update('workOrderId', e.target.value)}
              aria-invalid={Boolean(errors.workOrderId)}
              aria-describedby={errors.workOrderId ? 'df-order-err' : undefined}
            >
              <option value="">Select…</option>
              {ordersForStation.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.toUpperCase()} · {o.product}
                </option>
              ))}
            </select>
            {errors.workOrderId && <p id="df-order-err" className="field__error">{errors.workOrderId}</p>}
          </div>

          <div className="field">
            <label htmlFor="df-category">Category</label>
            <select id="df-category" value={form.category} onChange={(e) => update('category', e.target.value as DefectCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="field">
            <legend>Severity</legend>
            <div className="segmented segmented--fill">
              {SEVERITIES.map((s) => (
                <label key={s} className={`segmented__option ${form.severity === s ? 'segmented__option--on' : ''}`}>
                  <input type="radio" name="severity" value={s} checked={form.severity === s} onChange={() => update('severity', s)} />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor="df-desc">Description</label>
            <textarea
              id="df-desc"
              rows={4}
              maxLength={DESCRIPTION_MAX}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby="df-desc-hint"
              placeholder="What is wrong, where, and what was done about it"
            />
            <p id="df-desc-hint" className={errors.description ? 'field__error' : 'field__hint'}>
              {errors.description ?? `${form.description.length}/${DESCRIPTION_MAX}`}
            </p>
          </div>

          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Report defect'}
          </button>
          <p className={`form-message ${message ? `form-message--${message.tone}` : ''}`} role="status" aria-live="polite">
            {message?.text}
          </p>
        </form>
      </section>
    </div>
  )
}
