import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export interface ScanStateContextType {
  isScanActive: boolean
  setIsScanActive: (active: boolean) => void
  /** True while a Home landing (hero + crop selector) is on screen. Layout uses it for the dark canvas. */
  isLandingView: boolean
  /**
   * A mounted Home landing calls this and the returned function on unmount.
   * It is a counter, not a boolean: in Mobile Preview two Home screens are mounted (phone frame +
   * hidden standard view). With a boolean, the one that unmounts when you switch back to Web
   * turned the flag off while the other was still showing, leaving white text on the mint background.
   */
  registerLanding: () => () => void
}

const ScanStateContext = createContext<ScanStateContextType>({
  isScanActive: false,
  setIsScanActive: () => {},
  isLandingView: false,
  registerLanding: () => () => {},
})

function opensOnHome(): boolean {
  if (typeof window === 'undefined') return false
  const h = window.location.hash
  return h === '' || h === '#' || h === '#/'
}

export function ScanStateProvider({ children }: { children: ReactNode }) {
  const [isScanActive, setIsScanActive] = useState(false)
  const [landingCount, setLandingCount] = useState(0)
  // Until the first Home landing registers, assume dark if the app opened on Home,
  // so the very first paint already uses the dark canvas (no light flash).
  const [registeredOnce, setRegisteredOnce] = useState(false)
  const [initialHome] = useState(opensOnHome)

  const registerLanding = useCallback(() => {
    setRegisteredOnce(true)
    setLandingCount((c) => c + 1)
    return () => setLandingCount((c) => Math.max(0, c - 1))
  }, [])

  const isLandingView = landingCount > 0 || (!registeredOnce && initialHome)

  return (
    <ScanStateContext.Provider value={{ isScanActive, setIsScanActive, isLandingView, registerLanding }}>
      {children}
    </ScanStateContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
// oxlint-disable-next-line react/only-export-components
export function useScanState(): ScanStateContextType {
  return useContext(ScanStateContext)
}
