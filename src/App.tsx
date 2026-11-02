import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createApiFromEnv } from './api/lineApi'
import { AlarmList } from './components/AlarmList'
import { AppHeader } from './components/AppHeader'
import { DefectPanel } from './components/DefectPanel'
import { KpiCards } from './components/KpiCards'
import { LineFlow } from './components/LineFlow'
import { NavRail, type NavBadge } from './components/NavRail'
import { OrdersDue } from './components/OrdersDue'
import { StationGrid } from './components/StationGrid'
import { StatusBar } from './components/StatusBar'
import { WorkOrderTable } from './components/WorkOrderTable'
import { useHashView, type View } from './hooks/useHashView'
import { usePolling } from './hooks/usePolling'
import { buildAlarms } from './lib/alarms'
import { addDaysIso, DUE_SOON_DAYS, summarize } from './lib/metrics'
import type { NewDefect } from './types'

const api = createApiFromEnv()
const REFRESH_MS = 10_000

type Theme = 'light' | 'dark'

const PAGES: Record<View, { title: string; sub: string }> = {
  overview: { title: 'Line overview', sub: 'Live status of Line 2 for the current shift' },
  stations: { title: 'Stations', sub: 'OEE per station, split into availability, performance and quality' },
  orders: { title: 'Work orders', sub: 'Production orders on this line and how far along they are' },
  quality: { title: 'Quality', sub: 'Defects found on the line: report new ones, close resolved ones' },
}

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
  const view = useHashView()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const firstView = useRef(true)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('lineview-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // On view change: update the tab title and move focus to the new page heading (not on first load).
  useEffect(() => {
    document.title = `${PAGES[view].title} · LineView`
    if (firstView.current) {
      firstView.current = false
      return
    }
    window.scrollTo(0, 0)
    headingRef.current?.focus()
  }, [view])

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
  const soonIso = lastUpdated ? addDaysIso(lastUpdated, DUE_SOON_DAYS) : ''
  const alarms = useMemo(() => (data ? buildAlarms(data.stations, data.orders, data.defects, todayIso) : []), [data, todayIso])

  const badges: Partial<Record<View, NavBadge>> = {}
  if (data && summary) {
    const down = data.stations.filter((s) => s.status === 'down').length
    const overdue = data.orders.filter((o) => o.completed < o.quantity && o.due < todayIso).length
    badges.stations = { count: down, tone: 'alarm', label: 'stations down' }
    badges.orders = { count: overdue, tone: 'warn', label: 'orders overdue' }
    badges.quality = { count: summary.openDefects, tone: summary.criticalDefects > 0 ? 'alarm' : 'warn', label: 'open defects' }
  }

  const createDefect = async (input: NewDefect) => {
    await api.createDefect(input)
    refresh()
  }
  const closeDefect = async (id: string) => {
    await api.closeDefect(id)
    refresh()
  }

  function renderView() {
    if (!data || !summary) return null
    switch (view) {
      case 'overview':
        return (
          <>
            <KpiCards summary={summary} stations={data.stations} />
            <LineFlow stations={data.stations} />
            <div className="split">
              <AlarmList alarms={alarms} />
              <OrdersDue orders={data.orders} todayIso={todayIso} soonIso={soonIso} />
            </div>
          </>
        )
      case 'stations':
        return <StationGrid stations={data.stations} />
      case 'orders':
        return <WorkOrderTable orders={data.orders} stations={data.stations} todayIso={todayIso} soonIso={soonIso} />
      case 'quality':
        return <DefectPanel stations={data.stations} orders={data.orders} defects={data.defects} onCreate={createDefect} onClose={closeDefect} />
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppHeader mode={api.mode} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} onRefresh={refresh} />

      <div className="shell">
        <NavRail current={view} badges={badges} />

        <main id="main" className="workspace" tabIndex={-1}>
          <div className="page-head">
            <h1 ref={headingRef} tabIndex={-1}>
              {PAGES[view].title}
            </h1>
            <p className="page-head__sub">{PAGES[view].sub}</p>
          </div>

          {error && (
            <div className="alert" role="alert">
              <span className="alert__mark" aria-hidden="true" />
              <span>
                <strong>Couldn’t refresh data.</strong> {error.message}
                {data ? ' Showing the last data received.' : ''}
              </span>
              <button type="button" className="button button--secondary button--sm" onClick={refresh}>
                Try again
              </button>
            </div>
          )}

          {loading && !data ? (
            <div className="skeleton-stack" aria-busy="true" aria-label="Loading">
              <div className="skeleton skeleton--strip" />
              <div className="skeleton skeleton--block" />
            </div>
          ) : (
            renderView()
          )}
        </main>
      </div>

      <StatusBar mode={api.mode} error={error} lastUpdated={lastUpdated} intervalMs={REFRESH_MS} />
    </div>
  )
}
