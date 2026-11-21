import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Disclaimer } from './Disclaimer'
import { HelpCall } from './HelpCall'

describe('F7: Safety layer - Disclaimer component', () => {
  it('renders independently without any props and displays Bengali text with "প্রাথমিক স্ক্রিনিং" and "১৬১২৩"', () => {
    render(<Disclaimer />)

    const screeningMatches = screen.getAllByText(/প্রাথমিক স্ক্রিনিং/)
    expect(screeningMatches.length).toBeGreaterThan(0)

    const hotlineMatches = screen.getAllByText(/১৬১২৩/)
    expect(hotlineMatches.length).toBeGreaterThan(0)
  })

  it('renders English text when lang="en" is provided', () => {
    render(<Disclaimer lang="en" />)

    const screeningMatches = screen.getAllByText(/preliminary screening/i)
    expect(screeningMatches.length).toBeGreaterThan(0)

    const hotlineMatches = screen.getAllByText(/16123/)
    expect(hotlineMatches.length).toBeGreaterThan(0)
  })
})

describe('F7: Safety layer - HelpCall component', () => {
  it('renders independently without any props with href="tel:16123" and Bengali label', () => {
    render(<HelpCall />)

    const callLink = screen.getByRole('link')
    expect(callLink).toBeDefined()
    expect(callLink.getAttribute('href')).toBe('tel:16123')

    const hotlineMatches = screen.getAllByText(/১৬১২৩/)
    expect(hotlineMatches.length).toBeGreaterThan(0)
  })

  it('renders English text when lang="en" is provided with valid tel link', () => {
    render(<HelpCall lang="en" />)

    const callLink = screen.getByRole('link')
    expect(callLink).toBeDefined()
    expect(callLink.getAttribute('href')).toBe('tel:16123')

    const hotlineMatches = screen.getAllByText(/16123/)
    expect(hotlineMatches.length).toBeGreaterThan(0)
  })
})
