import { createContext, useContext, useState, type ReactNode } from 'react'

export interface ScanStateContextType {
  isScanActive: boolean
  setIsScanActive: (active: boolean) => void
}

const ScanStateContext = createContext<ScanStateContextType>({
  isScanActive: false,
  setIsScanActive: () => {},
})

export function ScanStateProvider({ children }: { children: ReactNode }) {
  const [isScanActive, setIsScanActive] = useState(false)
  return (
    <ScanStateContext.Provider value={{ isScanActive, setIsScanActive }}>
      {children}
    </ScanStateContext.Provider>
  )
}

/* eslint-disable react-refresh/only-export-components */
// oxlint-disable-next-line react/only-export-components
export function useScanState(): ScanStateContextType {
  return useContext(ScanStateContext)
}
