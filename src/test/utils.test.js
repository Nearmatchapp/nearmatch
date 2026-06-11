import { describe, it, expect, vi } from 'vitest'

vi.mock('../supabase.js', () => ({
  supabase: {},
}))

const { distanceKm, getGhostLabel, isProfileListable, calcAge, isoWeekKey, boostMillisLeft, applyUnread } = await import('../App.jsx')

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

describe('calcAge (B2: hónap/nap pontos korhatár)', () => {
  // Fix "ma": 2026-06-11
  const now = new Date('2026-06-11T12:00:00Z')

  it('a 18. születésnap előtt még 17 éves', () => {
    expect(calcAge('2008-06-12', now)).toBe(17) // holnap lesz 18
    expect(calcAge('2008-12-31', now)).toBe(17)
  })

  it('a 18. születésnapon és után már 18', () => {
    expect(calcAge('2008-06-11', now)).toBe(18) // ma 18
    expect(calcAge('2008-06-10', now)).toBe(18)
    expect(calcAge('2008-01-01', now)).toBe(18)
  })

  it('a régi (csak év alapú) számítás hibáját javítja', () => {
    // Évkülönbség szerint 2026-2008=18 lenne, valójában még 17
    expect(calcAge('2008-11-20', now)).toBe(17)
  })

  it('érvénytelen / üres bemenetre null', () => {
    expect(calcAge('', now)).toBeNull()
    expect(calcAge(null, now)).toBeNull()
    expect(calcAge('nem-datum', now)).toBeNull()
  })
})

describe('isoWeekKey (B3: heti boost limit kulcs, Postgres IYYYIW-vel egyező)', () => {
  it('2026-06-11 → 2026. ISO 24. hét', () => {
    expect(isoWeekKey(new Date('2026-06-11T12:00:00Z'))).toBe(202624)
  })

  it('évhatár: 2021-01-01 még az előző ISO év 53. hete', () => {
    expect(isoWeekKey(new Date('2021-01-01T12:00:00Z'))).toBe(202053)
  })

  it('évhatár: 2024-12-30 már a következő ISO év 1. hete', () => {
    expect(isoWeekKey(new Date('2024-12-30T12:00:00Z'))).toBe(202501)
  })
})

describe('boostMillisLeft (B3: boost állapot a profilból)', () => {
  const now = new Date('2026-06-11T12:00:00Z').getTime()

  it('nincs boost_expires_at → 0', () => {
    expect(boostMillisLeft(null, now)).toBe(0)
    expect(boostMillisLeft({}, now)).toBe(0)
    expect(boostMillisLeft({ boost_expires_at: null }, now)).toBe(0)
  })

  it('jövőbeli lejárat → hátralévő ms', () => {
    expect(boostMillisLeft({ boost_expires_at: '2026-06-11T12:05:00Z' }, now)).toBe(5 * 60 * 1000)
  })

  it('múltbeli lejárat → 0 (nem negatív)', () => {
    expect(boostMillisLeft({ boost_expires_at: '2026-06-11T11:00:00Z' }, now)).toBe(0)
  })

  it('érvénytelen dátum → 0', () => {
    expect(boostMillisLeft({ boost_expires_at: 'rossz' }, now)).toBe(0)
  })
})

describe('applyUnread (B6: olvasatlan badge)', () => {
  it('a halmazban lévő matchek unread=true, a többi false', () => {
    const matches = [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }]
    const result = applyUnread(matches, new Set(['m2']))
    expect(result.map(m => m.unread)).toEqual([false, true, false])
  })

  it('üres halmaz → minden olvasott', () => {
    expect(applyUnread([{ id: 'm1' }], new Set()).every(m => !m.unread)).toBe(true)
  })

  it('a meglévő mezőket nem bántja', () => {
    const [m] = applyUnread([{ id: 'm1', other: { name: 'X' } }], new Set(['m1']))
    expect(m.other.name).toBe('X')
    expect(m.unread).toBe(true)
  })
})
