import { useEffect, useState } from 'react'
import { shiftAt } from '../lib/shift'
import { Icon, LogoMark } from './Icon'

interface Props {
  mode: 'http' | 'demo'
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onRefresh: () => void
}

/** Wall clock in the header. Lives in its own component so only it re-renders every second. */
function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const shift = shiftAt(now)
  return (
    <>
      <li className="crumbs__item">
        Shift {shift.name} <span className="crumbs__dim">{shift.label}</span>
      </li>
      <li className="crumbs__clock" aria-hidden="true">
        <time className="mono" dateTime={now.toISOString()}>
          {now.toLocaleTimeString('en-GB')}
        </time>
      </li>
    </>
  )
}

export function AppHeader({ mode, theme, onToggleTheme, onRefresh }: Props) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <header className="appbar">
      <div className="appbar__brand">
        <LogoMark />
        <span className="appbar__name">LineView</span>
        <span className="appbar__module">Line Monitor</span>
      </div>

      <nav className="crumbs" aria-label="Location">
        <ol>
          <li className="crumbs__item">Plant IST-01</li>
          <li className="crumbs__item">Line 2 · MV switchgear</li>
          <Clock />
        </ol>
      </nav>

      <div className="appbar__actions">
        {mode === 'demo' && (
          <span className="source-tag" title="Running on in-browser mock data. Set VITE_API_URL to use a REST API.">
            Demo data
          </span>
        )}
        <button type="button" className="icon-button" onClick={onRefresh} aria-label="Refresh data" title="Refresh data">
          <Icon name="refresh" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </div>
    </header>
  )
}
