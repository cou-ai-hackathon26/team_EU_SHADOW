import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Disclaimer } from './Disclaimer'
import { HelpCall } from './HelpCall'

describe('F7: Safety layer - Disclaimer component', () => {
  it('renders independently without any props and displays Bengali text with "প্রাথমিক স্ক্রিনিং" and "১৬১২৩"', () => {
    render(<Disclaimer />)

    const textElement = screen.getByText(/প্রাথমিক স্ক্রিনিং/)
    expect(textElement).toBeDefined()
    expect(screen.getByText(/১৬১২৩/)).toBeDefined()
  })

  it('renders English text when lang="en" is provided', () => {
    render(<Disclaimer lang="en" />)

    expect(screen.getByText(/preliminary screening/i)).toBeDefined()
    expect(screen.getByText(/16123/)).toBeDefined()
  })
})

describe('F7: Safety layer - HelpCall component', () => {
  it('renders independently without any props with href="tel:16123" and Bengali label', () => {
    render(<HelpCall />)

    const callLink = screen.getByRole('link')
    expect(callLink).toBeDefined()
    expect(callLink.getAttribute('href')).toBe('tel:16123')
    expect(screen.getByText(/১৬১২৩/)).toBeDefined()
  })

  it('renders English text when lang="en" is provided with valid tel link', () => {
    render(<HelpCall lang="en" />)

    const callLink = screen.getByRole('link')
    expect(callLink).toBeDefined()
    expect(callLink.getAttribute('href')).toBe('tel:16123')
    expect(screen.getByText(/16123/)).toBeDefined()
  })
})
