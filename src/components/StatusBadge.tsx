import type { StationStatus } from '../types'

const LABELS: Record<StationStatus, string> = {
  running: 'Running',
  idle: 'Idle',
  down: 'Down',
  maintenance: 'Maintenance',
}

/**
 * Station state indicator. Each state has its own shape as well as colour
 * (running ●, idle ○, maintenance ◆, down ■), so it still reads in greyscale
 * or for colour-blind operators, following ISA-101 HMI guidance.
 */
export function StatusBadge({ status }: { status: StationStatus }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__mark" aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}

export const STATUS_LABELS = LABELS
