// Small inline SVG icon set (20×20 grid, 1.6 px strokes) so the app has no icon-font dependency.

const PATHS = {
  overview: (
    <>
      <rect x="3" y="3" width="6" height="8" />
      <rect x="11" y="3" width="6" height="4" />
      <rect x="11" y="9" width="6" height="8" />
      <rect x="3" y="13" width="6" height="4" />
    </>
  ),
  stations: <path d="M2.5 17V9l4.5 3V9l4.5 3V3.5h6V17z M2.5 17h15" />,
  orders: (
    <>
      <rect x="4" y="3.5" width="12" height="14" />
      <path d="M7 3.5V2h6v1.5 M7 8h6 M7 11h6 M7 14h4" />
    </>
  ),
  quality: <path d="M10 2.2 16 4.6v4.9c0 3.9-2.6 6.9-6 8.3-3.4-1.4-6-4.4-6-8.3V4.6z M7.2 10l2 2 3.6-3.8" />,
  refresh: <path d="M16.2 10a6.2 6.2 0 1 1-1.9-4.5 M16.5 2.8v3.6h-3.6" />,
  sun: (
    <>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 1.8v2.1 M10 16.1v2.1 M1.8 10h2.1 M16.1 10h2.1 M4.2 4.2l1.5 1.5 M14.3 14.3l1.5 1.5 M4.2 15.8l1.5-1.5 M14.3 5.7l1.5-1.5" />
    </>
  ),
  moon: <path d="M16 12.6A6.6 6.6 0 0 1 7.4 4a6.8 6.8 0 1 0 8.6 8.6z" />,
  search: <path d="M8.6 14.2a5.6 5.6 0 1 0 0-11.2 5.6 5.6 0 0 0 0 11.2z M12.8 12.8 17 17" />,
  alarm: <path d="M10 3 18 17H2z M10 8.2v4 M10 14.4v.1" />,
  chevron: <path d="M7.5 4.5 13 10l-5.5 5.5" />,
  plus: <path d="M10 4v12 M4 10h12" />,
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

/** LineView mark: a production line with three stations. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect width="24" height="24" rx="2" fill="var(--brand)" />
      <path d="M3 15h18" stroke="#fff" strokeWidth="1.6" />
      <rect x="4.5" y="8" width="4" height="7" fill="#fff" />
      <rect x="10" y="5" width="4" height="10" fill="#fff" />
      <rect x="15.5" y="10" width="4" height="5" fill="#fff" opacity=".6" />
    </svg>
  )
}
