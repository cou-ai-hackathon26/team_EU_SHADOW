import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import BottomNav from './BottomNav'

describe('BottomNav (F1 alias support)', () => {
  it('highlights alias routes such as #/accuracy for "কীভাবে কাজ করে"', () => {
    render(<BottomNav currentHash="#/accuracy" />)

    const howItWorksLink = screen.getByRole('link', { name: /কীভাবে কাজ করে/i })
    expect(howItWorksLink).toHaveAttribute('aria-current', 'page')

    const homeLink = screen.getByRole('link', { name: /হোম/i })
    expect(homeLink).not.toHaveAttribute('aria-current')
  })
})
