interface Props {
  mode: 'http' | 'demo'
  error: Error | undefined
  lastUpdated: Date | undefined
  intervalMs: number
}

/** Bottom status bar, like a desktop MES client: data source, connection state, last poll. */
export function StatusBar({ mode, error, lastUpdated, intervalMs }: Props) {
  const source = mode === 'demo' ? 'Demo data (in-browser)' : 'REST API'
  return (
    <footer className="statusbar">
      <span className={`statusbar__conn ${error ? 'statusbar__conn--lost' : ''}`}>
        <span className="statusbar__dot" aria-hidden="true" />
        {error ? 'Connection lost, showing last data' : 'Connected'}
      </span>
      <span>Source: {source}</span>
      <span className="statusbar__opt">Polling every {intervalMs / 1000} s</span>
      <span>
        Last update: <span className="mono">{lastUpdated ? lastUpdated.toLocaleTimeString('en-GB') : '--:--:--'}</span>
      </span>
      <span className="statusbar__end">LineView 1.1 · portfolio project, all data fictional</span>
    </footer>
  )
}
