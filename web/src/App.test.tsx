import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App shell and navigation (F1)', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  it('shows the product name and screening disclaimer with 16123', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /AgroLeaf AI/i })).toBeInTheDocument()
    expect(screen.getByText(/১৬১২৩/)).toBeInTheDocument()
  })

  it('shows all 4 nav items in Bangla: হোম, ইতিহাস, কীভাবে কাজ করে, সম্পর্কে', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: /হোম/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ইতিহাস/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /কীভাবে কাজ করে/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /সম্পর্কে/ })).toBeInTheDocument()
  })

  it('navigates to correct screen on nav click via hash routing without extra libraries', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Click on ইতিহাস
    await user.click(screen.getByRole('link', { name: /ইতিহাস/ }))
    expect(window.location.hash).toBe('#/history')
    expect(screen.getByRole('heading', { level: 1, name: /ইতিহাস/ })).toBeInTheDocument()

    // Click on কীভাবে কাজ করে
    await user.click(screen.getByRole('link', { name: /কীভাবে কাজ করে/ }))
    expect(window.location.hash).toBe('#/how-it-works')
    expect(screen.getByRole('heading', { level: 1, name: /কীভাবে কাজ করে/ })).toBeInTheDocument()

    // Click on সম্পর্কে
    await user.click(screen.getByRole('link', { name: /সম্পর্কে/ }))
    expect(window.location.hash).toBe('#/about')
    expect(screen.getByRole('heading', { level: 1, name: /সম্পর্কে/ })).toBeInTheDocument()

    // Click on হোম
    await user.click(screen.getByRole('link', { name: /হোম/ }))
    expect(window.location.hash === '' || window.location.hash === '#/').toBe(true)
    expect(screen.getByRole('heading', { level: 1, name: /AgroLeaf AI/ })).toBeInTheDocument()
  })

  it('renders an h1 heading on every screen', async () => {
    render(<App />)

    // Home screen has h1
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()

    // Hash change to #/history
    act(() => {
      window.location.hash = '#/history'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1, name: /ইতিহাস/ })).toBeInTheDocument()

    // Hash change to #/how-it-works
    act(() => {
      window.location.hash = '#/how-it-works'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1, name: /কীভাবে কাজ করে/ })).toBeInTheDocument()

    // Hash change to #/about
    act(() => {
      window.location.hash = '#/about'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(screen.getByRole('heading', { level: 1, name: /সম্পর্কে/ })).toBeInTheDocument()
  })
})
