import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AnalyzeButton from './AnalyzeButton'

describe('AnalyzeButton (F4)', () => {
  it('calls onAnalyze when clicked and is not disabled', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn()
    render(<AnalyzeButton onAnalyze={onAnalyze} />)

    const btn = screen.getByRole('button', { name: /Analyze|শনাক্ত|বিশ্লেষণ/i })
    expect(btn).toBeInTheDocument()
    expect(btn).not.toBeDisabled()

    await user.click(btn)
    expect(onAnalyze).toHaveBeenCalledTimes(1)
  })

  it('shows loading state and is disabled when loading is true', () => {
    render(<AnalyzeButton onAnalyze={vi.fn()} loading={true} />)

    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent(/চলছে|লোড/i)
  })
})
