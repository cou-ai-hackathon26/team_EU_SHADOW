import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isScanActiveIn, useScanSession } from './scanSession'

export interface ScanStateContextType {
  /** A photo, result or error is on screen. */
  isScanActive: boolean
  /** The Home hero + crop selector is on screen. Layout uses it for the dark canvas. */
  isLandingView: boolean
}

const ScanStateContext = createContext<ScanStateContextType>({
  isScanActive: false,
  isLandingView: false,
})

function readHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

function isHomeHash(h: string): boolean {
  return h === '' || h === '#' || h === '#/'
}

/**
 * Derived view of the shared scan session (see scanSession.ts) plus the current route.
 * Both are global, so every mounted copy of a screen (Web view, Mobile preview frame) agrees,
 * and the very first render on Home is already dark (no light flash).
 */
export function ScanStateProvider({ children }: { children: ReactNode }) {
  const session = useScanSession()
  const [hash, setHash] = useState(readHash)

  useEffect(() => {
    const onHash = () => setHash(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const value: ScanStateContextType = {
    isScanActive: isScanActiveIn(session),
    isLandingView: isHomeHash(hash) && !session.crop,
  }

  return <ScanStateContext.Provider value={value}>{children}</ScanStateContext.Provider>
}

/* eslint-disable react-refresh/only-export-components */
// oxlint-disable-next-line react/only-export-components
export function useScanState(): ScanStateContextType {
  return useContext(ScanStateContext)
}
