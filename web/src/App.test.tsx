import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  it('shows the product name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /AgroLeaf AI/i })).toBeInTheDocument()
  })

  it('always shows the screening disclaimer with 16123', () => {
    render(<App />)
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
  })
})
