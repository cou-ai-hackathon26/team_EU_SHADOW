import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { CropRotationCard } from './CropRotationCard'
import { resetGlobalLang, STORAGE_KEY } from '../../i18n/useT'

const dec = new Date(2026, 11, 5)

describe('CropRotationCard (ফসল চক্র পরামর্শ)', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    act(() => resetGlobalLang())
  })

  it('shows Bangla advice for the division, season and live weather', () => {
    render(<CropRotationCard divisionId="rajshahi" summary={{ minTemp: 12, maxTemp: 25, maxRh: 70, totalRainMm: 0, rainyHours: 0 }} now={dec} />)
    expect(screen.getByRole('heading', { name: 'ফসল চক্র পরামর্শ' })).toBeInTheDocument()
    expect(screen.getByText(/রাজশাহী • রবি মৌসুম/)).toBeInTheDocument()
    expect(screen.getByText('গম')).toBeInTheDocument()
    expect(screen.getAllByText('কেন উপযোগী:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('রোগচক্র ভাঙে:').length).toBeGreaterThan(0)
    expect(screen.getByText(/আগামী ৩ দিনের পূর্বাভাস/)).toBeInTheDocument()
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
  })

  it('shows English when the language is EN', () => {
    localStorage.setItem(STORAGE_KEY, 'en')
    act(() => resetGlobalLang())
    render(<CropRotationCard divisionId="khulna" summary={null} now={dec} />)
    expect(screen.getByRole('heading', { name: 'Smart Crop Rotation' })).toBeInTheDocument()
    expect(screen.getByText(/Khulna • Rabi season/)).toBeInTheDocument()
    expect(screen.getByText('Sunflower')).toBeInTheDocument()
    expect(screen.getByText(/works offline/)).toBeInTheDocument()
    expect(screen.getByText(/16123/)).toBeInTheDocument()
  })

  it('falls back to general Bangladesh advice without location or weather', () => {
    render(<CropRotationCard divisionId={null} summary={null} now={new Date(2026, 7, 1)} />)
    expect(screen.getByText(/বাংলাদেশ \(সাধারণ\) • খরিফ-২/)).toBeInTheDocument()
    expect(document.querySelectorAll('[data-rotation-crop]').length).toBeGreaterThan(0)
  })
})
