import { useCallback, useEffect, useMemo, useState } from 'react'
import { createApiFromEnv } from './api/lineApi'
import { DefectPanel } from './components/DefectPanel'
import { KpiCards } from './components/KpiCards'
import { StationGrid } from './components/StationGrid'
import { WorkOrderTable } from './components/WorkOrderTable'
import { usePolling } from './hooks/usePolling'
import { summarize } from './lib/metrics'
import type { NewDefect } from './types'

const api = createApiFromEnv()
const REFRESH_MS = 10_000

type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem('lineview-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage can be blocked; fall back to the OS setting */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('lineview-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // One snapshot of everything, fetched in parallel and refreshed every 10 s.
  const fetchSnapshot = useCallback(async (signal: AbortSignal) => {
    const [stations, orders, defects] = await Promise.all([api.getStations(signal), api.getWorkOrders(signal), api.getDefects(signal)])
    return { stations, orders, defects }
  }, [])
  const { data, error, loading, lastUpdated, refresh } = usePolling(fetchSnapshot, REFRESH_MS)

  const summary = useMemo(
    () => (data && lastUpdated ? summarize(data.stations, data.orders, data.defects, lastUpdated) : null),
    [data, lastUpdated],
  )
  const todayIso = lastUpdated?.toISOString().slice(0, 10) ?? ''

  const createDefect = async (input: NewDefect) => {
    await api.createDefect(input)
    refresh()
  }
  const closeDefect = async (id: string) => {
    await api.closeDefect(id)
    refresh()
  }

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <div className="topbar__brand">
          <span className="logo" aria-hidden="true">
            ▦
          </span>
          <div>
            <h1>LineView</h1>
            <p className="topbar__sub">Production line dashboard · demo data</p>
          </div>
        </div>
        <div className="topbar__actions">
          {api.mode === 'demo' && (
            <span className="demo-tag" title="Running on in-browser mock data. Set VITE_API_URL to use a REST API.">
              Demo mode
            </span>
          )}
          <span className="updated" aria-live="polite">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
          </span>
          <button type="button" className="button button--ghost" onClick={refresh}>
            Refresh
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </header>

      <main id="main" className="container">
        {error && (
          <div className="alert" role="alert">
            <strong>Couldn’t refresh data.</strong> {error.message}
            {data ? ' Showing the last data received.' : ''}
            <button type="button" className="button button--ghost" onClick={refresh}>
              Try again
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="skeleton-grid" aria-busy="true" aria-label="Loading dashboard">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="skeleton" />
            ))}
          </div>
        ) : data && summary ? (
          <>
            <KpiCards summary={summary} stationCount={data.stations.length} />
            <StationGrid stations={data.stations} />
            <WorkOrderTable orders={data.orders} todayIso={todayIso} />
            <DefectPanel stations={data.stations} orders={data.orders} defects={data.defects} onCreate={createDefect} onClose={closeDefect} />
          </>
        ) : null}
      </main>

      <footer className="footer">
        LineView is a portfolio project with made-up data. Built with React, TypeScript and Vite.
      </footer>
    </>
  )
}
