import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScanProgress } from './ScanProgress'

describe('ScanProgress component', () => {
  it('renders detecting stage with Bangla instruction', () => {
    render(<ScanProgress stage="detecting" done={0} total={0} lang="bn" />)
    expect(screen.getByText(/ছবিতে পাতা খোঁজা হচ্ছে…/)).toBeInTheDocument()
  })

  it('renders detecting stage with English instruction', () => {
    render(<ScanProgress stage="detecting" done={0} total={0} lang="en" />)
    expect(screen.getByText(/Finding leaves in image…/)).toBeInTheDocument()
  })

  it('renders classifying progress text 1/3 and updates to 3/3 in Bangla digits', () => {
    const { rerender } = render(<ScanProgress stage="classifying" done={1} total={3} lang="bn" />)
    expect(screen.getByText(/পাতা ১\/৩ বিশ্লেষণ হচ্ছে…/)).toBeInTheDocument()

    rerender(<ScanProgress stage="classifying" done={3} total={3} lang="bn" />)
    expect(screen.getByText(/পাতা ৩\/৩ বিশ্লেষণ হচ্ছে…/)).toBeInTheDocument()
  })

  it('renders classifying progress text in English', () => {
    render(<ScanProgress stage="classifying" done={2} total={5} lang="en" />)
    expect(screen.getByText(/Analyzing leaf 2\/5…/)).toBeInTheDocument()
  })

  it('renders cancel button and triggers onCancel callback', () => {
    const onCancel = vi.fn()
    render(<ScanProgress stage="classifying" done={1} total={4} lang="bn" onCancel={onCancel} />)
    const cancelBtn = screen.getByRole('button', { name: /বাতিল/i })
    expect(cancelBtn).toBeInTheDocument()
    fireEvent.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
