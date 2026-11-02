import { hrefFor, type View } from '../hooks/useHashView'
import { Icon, type IconName } from './Icon'

export interface NavBadge {
  count: number
  tone: 'alarm' | 'warn'
  label: string
}

const ITEMS: { view: View; label: string; icon: IconName }[] = [
  { view: 'overview', label: 'Overview', icon: 'overview' },
  { view: 'stations', label: 'Stations', icon: 'stations' },
  { view: 'orders', label: 'Work orders', icon: 'orders' },
  { view: 'quality', label: 'Quality', icon: 'quality' },
]

export function NavRail({ current, badges }: { current: View; badges: Partial<Record<View, NavBadge>> }) {
  return (
    <nav className="rail" aria-label="Main">
      <ul>
        {ITEMS.map((item) => {
          const badge = badges[item.view]
          return (
            <li key={item.view}>
              <a href={hrefFor(item.view)} className="rail__link" aria-current={current === item.view ? 'page' : undefined}>
                <Icon name={item.icon} size={20} />
                <span className="rail__label">{item.label}</span>
                {badge && badge.count > 0 && (
                  <span className={`rail__badge rail__badge--${badge.tone}`}>
                    {badge.count}
                    <span className="visually-hidden"> {badge.label}</span>
                  </span>
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
