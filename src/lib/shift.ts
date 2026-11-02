// Three-shift pattern used on the (fictional) line: A 06–14, B 14–22, C 22–06.

export interface Shift {
  name: 'A' | 'B' | 'C'
  label: string
}

export function shiftAt(date: Date): Shift {
  const h = date.getHours()
  if (h >= 6 && h < 14) return { name: 'A', label: '06:00–14:00' }
  if (h >= 14 && h < 22) return { name: 'B', label: '14:00–22:00' }
  return { name: 'C', label: '22:00–06:00' }
}
