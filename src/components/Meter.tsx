import type { Tone } from '../lib/metrics'

interface Props {
  /** 0–1 */
  value: number
  /** Optional target line, 0–1. */
  target?: number
  /** Normal values stay grey; only off-target values get colour. */
  tone?: Tone | 'neutral'
  label: string
  size?: 'md' | 'sm'
}

const pct = (x: number) => `${Math.min(100, Math.max(0, x * 100))}%`

export function Meter({ value, target, tone = 'neutral', label, size = 'md' }: Props) {
  return (
    <div className={`meter meter--${size}`} role="img" aria-label={label}>
      <div className={`meter__fill meter__fill--${tone}`} style={{ width: pct(value) }} />
      {target !== undefined && <div className="meter__target" style={{ left: pct(target) }} />}
    </div>
  )
}
