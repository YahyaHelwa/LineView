import { describe, expect, it } from 'vitest'
import { shiftAt } from '../lib/shift'
import { viewFromHash } from './useHashView'

describe('viewFromHash', () => {
  it('reads known views and ignores anything else', () => {
    expect(viewFromHash('#/stations')).toBe('stations')
    expect(viewFromHash('#quality')).toBe('quality')
    expect(viewFromHash('#main')).toBeNull()
    expect(viewFromHash('')).toBeNull()
  })
})

describe('shiftAt', () => {
  it('maps the hour to shift A (06–14), B (14–22) or C (22–06)', () => {
    expect(shiftAt(new Date(2026, 10, 2, 6, 0)).name).toBe('A')
    expect(shiftAt(new Date(2026, 10, 2, 13, 59)).name).toBe('A')
    expect(shiftAt(new Date(2026, 10, 2, 14, 0)).name).toBe('B')
    expect(shiftAt(new Date(2026, 10, 2, 23, 30)).name).toBe('C')
    expect(shiftAt(new Date(2026, 10, 2, 3, 0)).name).toBe('C')
  })
})
