import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ScanStateContextType {
  isScanActive: boolean
  setIsScanActive: (active: boolean) => void
  /** True while the Home landing (hero + crop selector) is on screen. Layout uses it for the dark canvas. */
  isLandingView: boolean
  setIsLandingView: (active: boolean) => void
}

const ScanStateContext = createContext<ScanStateContextType>({
  isScanActive: false,
  setIsScanActive: () => {},
  isLandingView: false,
  setIsLandingView: () => {},
})

export function ScanStateProvider({ children }: { children: ReactNode }) {
  const [isScanActive, setIsScanActive] = useState(false)
  // Start true when the app opens on Home, so the very first paint already uses the dark landing canvas
  // (no light flash while waiting for HomeScreen's effect).
  const [isLandingView, setIsLandingView] = useState(() => {
    if (typeof window === 'undefined') return false
    const h = window.location.hash
    return h === '' || h === '#' || h === '#/'
  })
  return (
    <ScanStateContext.Provider value={{ isScanActive, setIsScanActive, isLandingView, setIsLandingView }}>
      {children}
    </ScanStateContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
// oxlint-disable-next-line react/only-export-components
export function useScanState(): ScanStateContextType {
  return useContext(ScanStateContext)
}
