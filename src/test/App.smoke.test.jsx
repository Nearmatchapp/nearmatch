import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// A supabase klienst teljesen mockoljuk: a smoke teszt session nélküli
// (kijelentkezett) állapotot szimulál, így az AuthScreen-nek kell megjelennie.
vi.mock('../supabase.js', () => {
  const subscription = { unsubscribe: vi.fn() }
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
      },
      from: vi.fn(),
      channel: vi.fn(),
      removeChannel: vi.fn(),
    },
  }
})

const { default: App } = await import('../App.jsx')

beforeEach(() => {
  window.history.replaceState({}, '', '/')
  localStorage.clear()
})

describe('App smoke', () => {
  it('session nélkül az auth képernyő jelenik meg', async () => {
    render(<App />)
    expect(await screen.findByText('Folytatás Google-lel')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email cím')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Jelszó')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'NearMatch' })).toBeInTheDocument()
  })

  it('login és regisztráció tab között váltható', async () => {
    render(<App />)
    const regTab = await screen.findByRole('button', { name: 'Regisztráció' })
    fireEvent.click(regTab)
    expect(await screen.findByRole('button', { name: 'Regisztráció →' })).toBeInTheDocument()
  })
})
