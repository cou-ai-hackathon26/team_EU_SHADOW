import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HomeScreen } from '../../app/router'
import { ScanStateProvider } from '../../app/scanStateContext'
import { PhoneFrameProvider } from '../../app/viewportFrame'
import { resetGlobalLang, STORAGE_KEY } from '../../i18n/useT'
import { LanguageToggle } from '../../i18n/useT'

vi.mock('../../ai/engine', () => ({ loadModel: vi.fn(), analyze: vi.fn() }))

function renderHome(inFrame = false) {
  return render(
    <ScanStateProvider>
      <PhoneFrameProvider value={inFrame}>
        <LanguageToggle />
        <HomeScreen />
      </PhoneFrameProvider>
    </ScanStateProvider>
  )
}

const cropButton = (id: string) => document.querySelector(`[data-crop="${id}"]`) as HTMLButtonElement

describe('Home landing and crop selector', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    act(() => resetGlobalLang())
  })

  it('shows 4 crop cards and only rice is active', () => {
    renderHome()
    for (const id of ['rice', 'brinjal', 'potato', 'tomato']) expect(cropButton(id)).toBeInTheDocument()
    expect(cropButton('rice')).not.toHaveAttribute('aria-disabled')
    expect(cropButton('rice')).toHaveTextContent('সক্রিয়')
    for (const id of ['brinjal', 'potato', 'tomato']) {
      expect(cropButton(id)).toHaveAttribute('aria-disabled', 'true')
      expect(cropButton(id)).toHaveTextContent('শীঘ্রই আসছে')
    }
  })

  it('shows scientific names', () => {
    renderHome()
    expect(screen.getAllByText(/Oryza sativa/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Solanum melongena/)).toBeInTheDocument()
    expect(screen.getByText(/Solanum tuberosum/)).toBeInTheDocument()
    expect(screen.getByText(/Solanum lycopersicum/)).toBeInTheDocument()
  })

  it('an upcoming crop shows the toast and does not open the scanner', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(cropButton('potato'))
    expect(screen.getByRole('status')).toHaveTextContent(/শুধুমাত্র ধানের রোগ নির্ণয় সক্রিয়/)
    expect(screen.queryByRole('button', { name: /ফসল নির্বাচন/ })).not.toBeInTheDocument()
    expect(cropButton('rice')).toBeInTheDocument()
  })

  it('the rice card opens the scanner and Back returns to the crops', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(cropButton('rice'))
    expect(screen.getByRole('button', { name: /ক্যামেরা/ })).toBeInTheDocument()
    expect(cropButton('rice')).toBeNull()

    await user.click(screen.getByRole('button', { name: /ফসল নির্বাচন/ }))
    expect(cropButton('rice')).toBeInTheDocument()
  })

  it('the hero button opens the scanner', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: /ধান স্ক্যান করুন/ }))
    expect(screen.getByRole('button', { name: /ফসল নির্বাচন/ })).toBeInTheDocument()
  })

  it('the hero says 5 diseases + healthy, never "6 diseases"', () => {
    renderHome()
    expect(screen.getAllByText(/৫টি রোগ \+ সুস্থ পাতা/).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/৬টি রোগ/)
  })

  it('the EN toggle translates the hero and crops', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: /ভাষা পরিবর্তন/ }))
    expect(screen.getByRole('heading', { name: 'Show a leaf, know the disease' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Are My Rice Plants Healthy?' })).toBeInTheDocument()
    expect(cropButton('rice')).toHaveTextContent('Rice')
    expect(cropButton('tomato')).toHaveTextContent('Upcoming')
  })

  it('inside the phone frame only the mobile hero is shown', () => {
    renderHome(true)
    const desktopHero = screen.getByRole('heading', { name: 'পাতা দেখান, রোগের সমাধান জানুন', hidden: true }).closest('section')
    expect(desktopHero?.className).toMatch(/(^|\s)hidden(\s|$)/)
    expect(desktopHero?.className).not.toMatch(/lg:block/)
    const mobileHero = screen.getByRole('heading', { name: 'আমার ধানগাছ কি সুস্থ?' }).closest('section')
    expect(mobileHero?.className).not.toMatch(/lg:hidden/)
  })
})
