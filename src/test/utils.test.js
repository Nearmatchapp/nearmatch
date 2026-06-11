import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase.js', () => ({
  supabase: {},
}))

const { distanceKm, getGhostLabel } = await import('../App.jsx')

describe('distanceKm', () => {
  it('ugyanaz a pont 0 km', () => {
    expect(distanceKm(47.4979, 19.0402, 47.4979, 19.0402)).toBe(0)
  })

  it('Budapest–Debrecen kb. 193 km légvonalban', () => {
    const d = distanceKm(47.4979, 19.0402, 47.5316, 21.6273)
    expect(d).toBeGreaterThan(185)
    expect(d).toBeLessThan(200)
  })

  it('rövid táv (kb. 1 km) is pontos', () => {
    // ~0.009 fok szélesség ≈ 1 km
    const d = distanceKm(47.4979, 19.0402, 47.5069, 19.0402)
    expect(d).toBeGreaterThan(0.95)
    expect(d).toBeLessThan(1.05)
  })
})

describe('getGhostLabel', () => {
  it('null/undefined score-ra null', () => {
    expect(getGhostLabel(null)).toBeNull()
    expect(getGhostLabel(undefined)).toBeNull()
  })

  it('sávhatárok a megfelelő címkét adják', () => {
    expect(getGhostLabel(100).label).toBe('Kiváló válaszoló')
    expect(getGhostLabel(81).label).toBe('Kiváló válaszoló')
    expect(getGhostLabel(80).label).toBe('Megbízható')
    expect(getGhostLabel(61).label).toBe('Megbízható')
    expect(getGhostLabel(60).label).toBe('Közepes')
    expect(getGhostLabel(41).label).toBe('Közepes')
    expect(getGhostLabel(40).label).toBe('Gyenge válaszoló')
    expect(getGhostLabel(21).label).toBe('Gyenge válaszoló')
    expect(getGhostLabel(20).label).toBe('Szellem')
    expect(getGhostLabel(0).label).toBe('Szellem')
  })
})
