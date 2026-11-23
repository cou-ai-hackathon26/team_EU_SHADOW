import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LocalWeatherRiskModule } from './LocalWeatherRiskModule'

describe('LocalWeatherRiskModule Component', () => {
  it('renders heading, weather card, and district dropdown', async () => {
    render(<LocalWeatherRiskModule lang="bn" />)

    expect(
      screen.getByRole('heading', { name: /স্থানীয় আবহাওয়া, ফসল ও রোগের ঝুঁকি/i })
    ).toBeInTheDocument()

    expect(screen.getByRole('combobox', { name: /জেলা নির্বাচন করুন:/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /আমার এলাকা শনাক্ত করুন/i })).toBeInTheDocument()
  })

  it('allows changing district via dropdown', async () => {
    render(<LocalWeatherRiskModule lang="bn" />)

    const select = screen.getByRole('combobox', { name: /জেলা নির্বাচন করুন:/i })
    fireEvent.change(select, { target: { value: 'cumilla' } })

    await waitFor(() => {
      expect(screen.getByText(/নির্বাচিত: কুমিল্লা জেলা/i)).toBeInTheDocument()
    })
  })

  it('renders in English when lang is en', async () => {
    render(<LocalWeatherRiskModule lang="en" />)

    expect(
      screen.getByRole('heading', { name: /Local Weather, Crop & Disease Risk/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Auto GPS Detect/i })).toBeInTheDocument()
  })
})
