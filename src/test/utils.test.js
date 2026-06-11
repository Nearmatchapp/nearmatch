import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase.js', () => ({
  supabase: {},
}))

const { distanceKm, getGhostLabel, isProfileListable } = await import('../App.jsx')

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

describe('isProfileListable (B1: kitiltás + inkognito + swipe szűrés)', () => {
  const none = { swipedIds: new Set(), likedUsIds: new Set() }

  it('kitiltott user soha nem listázható', () => {
    expect(isProfileListable({ id: 'u1', is_banned: true }, none)).toBe(false)
    // akkor sem, ha likeolt minket (inkognito-kivétel nem írja felül a tiltást)
    expect(isProfileListable(
      { id: 'u1', is_banned: true, is_incognito: true },
      { swipedIds: new Set(), likedUsIds: new Set(['u1']) }
    )).toBe(false)
  })

  it('nem tiltott user listázható (is_banned false vagy hiányzó mező)', () => {
    expect(isProfileListable({ id: 'u1', is_banned: false }, none)).toBe(true)
    expect(isProfileListable({ id: 'u1' }, none)).toBe(true)
  })

  it('már swipe-olt user nem listázható', () => {
    expect(isProfileListable({ id: 'u1' }, { swipedIds: new Set(['u1']), likedUsIds: new Set() })).toBe(false)
  })

  it('inkognito user csak annak látszik, akit likeolt', () => {
    expect(isProfileListable({ id: 'u1', is_incognito: true }, none)).toBe(false)
    expect(isProfileListable(
      { id: 'u1', is_incognito: true },
      { swipedIds: new Set(), likedUsIds: new Set(['u1']) }
    )).toBe(true)
  })
})
